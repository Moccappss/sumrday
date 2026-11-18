import React, { useState, useEffect, useRef } from 'react';
import {
  Database, Save, Building2, CreditCard, Phone, Globe, Star, ShoppingBag,
  BookOpen, Receipt, Quote, HelpCircle, Link2, Plus, Trash2, Check, RefreshCw,
  ArrowLeft, Image as ImageIcon, QrCode, CheckCircle2,
  ChevronDown, ChevronUp, SlidersHorizontal, User,
  GraduationCap, Languages as LanguagesIcon, Code2, LayoutList, Layers,
  Edit3, X, Search
} from 'lucide-react';
import { storage } from '../../utils/storage';
import {
  syncUnifiedStudioData,
  BUSINESS_PROFILE_STORAGE_KEY
} from '../../utils/unifiedDataSync';
import { setGlobalSiteMode } from '../landing/useLandingData';
import { BusinessProfile, BankAccount, DEFAULT_BUSINESS_PROFILE } from '../../types/businessProfile';
import MediaGalleryModal from './MediaGalleryModal';
import { useDialog } from './DialogProvider';

const BANK_PRESETS = [
  { name: 'BCA', color: '#003399' },
  { name: 'Mandiri', color: '#002d62' },
  { name: 'BRI', color: '#00529c' },
  { name: 'BNI', color: '#f15a24' },
  { name: 'Bank Jago', color: '#8a2be2' },
  { name: 'SeaBank', color: '#ff5722' },
  { name: 'BSI', color: '#00a39d' },
  { name: 'DANA', color: '#118eea' },
  { name: 'GoPay', color: '#00aa13' },
  { name: 'OVO', color: '#4c2a86' },
];

const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', prefix: '@', placeholder: 'sumrday.studio' },
  { id: 'tiktok', name: 'TikTok', prefix: '@', placeholder: 'sumrday.studio' },
  { id: 'youtube', name: 'YouTube', prefix: '@', placeholder: 'sumrday' },
  { id: 'linkedin', name: 'LinkedIn', prefix: 'in/', placeholder: 'sumrday' },
  { id: 'twitter', name: 'X / Twitter', prefix: '@', placeholder: 'sumrday' },
  { id: 'facebook', name: 'Facebook', prefix: '/', placeholder: 'sumrday' },
  { id: 'github', name: 'GitHub', prefix: '/', placeholder: 'sumrday' },
  { id: 'telegram', name: 'Telegram', prefix: '@', placeholder: 'sumrdayadmin' },
  { id: 'discord', name: 'Discord', prefix: 'gg/', placeholder: 'invite' },
  { id: 'threads', name: 'Threads', prefix: '@', placeholder: 'sumrday.studio' },
];

const POPULAR_SKILL_PRESETS = [
  { name: 'Figma', description: 'UI/UX & Interactive Prototyping' },
  { name: 'Adobe Photoshop', description: 'Photo Editing & Digital Art' },
  { name: 'Adobe Illustrator', description: 'Vector Art & Brand Identity' },
  { name: 'After Effects', description: 'Motion Design & Visual Effects' },
  { name: 'Blender 3D', description: '3D Modeling & Rendering' },
  { name: 'React.js', description: 'Modern Web Component Architecture' },
  { name: 'Next.js', description: 'Fullstack React & SSR/SSG' },
  { name: 'TypeScript', description: 'Type-Safe Application Code' },
  { name: 'Tailwind CSS', description: 'Utility-First Modern Styling' },
  { name: 'WordPress', description: 'CMS Development & Gutenberg' },
  { name: 'UI/UX Design', description: 'Wireframing, User Flow & Design System' },
  { name: 'Brand Identity', description: 'Logo, Typography & Visual Guidelines' }
];

const POPULAR_LANG_PRESETS = [
  'Bahasa Indonesia (Native)',
  'English (Professional)',
  'English (Conversational)',
  'Mandarin (Basic)',
  'Japanese (Basic)'
];

type MasterSection =
  | 'company_identity'
  | 'personal_identity'
  | 'skills_history'
  | 'banking'
  | 'contact'
  | 'socials'
  | 'portfolio'
  | 'catalog'
  | 'blog'
  | 'ratecard'
  | 'reviews'
  | 'faq'
  | 'links'
  | 'all';

interface MasterFormHubProps {
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onBack?: () => void;
  isDarkMode?: boolean;
}

const getSkillName = (s: any): string => {
  if (!s) return '';
  if (typeof s === 'string') return s;
  return s.name || s.title || s.label || '';
};

const getSkillDesc = (s: any): string => {
  if (!s || typeof s === 'string') return '';
  return s.description || s.desc || '';
};

const getSkillId = (s: any, idx: number): string => {
  if (s && typeof s === 'object' && s.id) return String(s.id);
  if (typeof s === 'string') return `skill_${idx}_${s.replace(/\s+/g, '_')}`;
  return `skill_${idx}`;
};

export const MasterFormHub: React.FC<MasterFormHubProps> = ({
  notify = () => {},
  onBack,
  isDarkMode = true
}) => {
  const { showConfirm } = useDialog();

  const [entityMode, setEntityMode] = useState<'company' | 'personal'>('company');
  const [activeSection, setActiveSection] = useState<MasterSection>('company_identity');
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasProfileChanges, setHasProfileChanges] = useState(false);

  // 1. COMPANY / STUDIO PROFILE
  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_BUSINESS_PROFILE);
  const [companyExtra, setCompanyExtra] = useState({
    legalName: '',
    industry: 'Creative Digital Studio',
    teamSize: '5-10 Orang',
    establishedYear: '2024',
    coverUrl: '',
    logoUrl: ''
  });

  // 2. PERSONAL BIODATA PROFILE
  const [biodata, setBiodata] = useState({
    fullName: 'Arif Darmawan',
    nickName: 'Arif',
    role: 'Creative Director & Designer',
    company: 'sumr.day Studio',
    experienceYears: '5',
    location: 'Jakarta Selatan',
    website: 'https://sumrday.web.app',
    bio: 'Creative Digital Craftsman with Warm Tech aesthetics.',
    fullBio: 'Berpengalaman selama 5+ tahun dalam merancang identitas digital dan web aplikasi kreatif.',
    avatarUrl: '',
    coverUrl: '',
    socialLinks: {
      github: '',
      linkedin: '',
      instagram: '',
      twitter: ''
    },
    skills: [
      { id: 'sk-1', name: 'Figma', description: 'UI/UX Design, Prototyping & Design Systems' },
      { id: 'sk-2', name: 'React.js', description: 'Component Architecture & State Management' },
      { id: 'sk-3', name: 'TypeScript', description: 'Type-Safe Web Application Development' },
      { id: 'sk-4', name: 'TailwindCSS', description: 'Responsive Layouts & Design Tokens' },
      { id: 'sk-5', name: 'Brand Identity', description: 'Logo Creation & Visual Guidelines' }
    ] as any[],
    languages: ['Bahasa Indonesia (Native)', 'English (Professional)'] as string[],
    education: [
      { institution: 'Universitas Indonesia', degree: 'S1 Ilmu Komputer', startYear: '2016', endYear: '2020', description: 'Software Engineering' }
    ],
    experiences: [
      { company: 'sumr.day', role: 'Creative Director', startYear: '2024', endYear: 'Sekarang', description: 'Memimpin desain interaktif studio.' }
    ],
    organizations: [
      { name: 'Komunitas Kreatif', role: 'Mentor', startYear: '2021', endYear: 'Sekarang', description: 'Workshop UI/UX & Web.' }
    ],
    certifications: [
      { name: 'Google Cloud Engineer', issuer: 'Google', year: '2023', credentialUrl: '' }
    ]
  });

  // Quick inputs
  const [newSkillInput, setNewSkillInput] = useState({ name: '', description: '' });
  const [newLangInput, setNewLangInput] = useState('');

  // 3. COLLECTIONS
  const [portfolioList, setPortfolioList] = useState<any[]>([]);
  const [newPortfolio, setNewPortfolio] = useState({
    title: '',
    category: 'Branding',
    description: '',
    image: '',
    link: '',
    tags: ''
  });

  const [catalogList, setCatalogList] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'Digital',
    type: 'digital',
    description: '',
    image: '',
    stock: 99
  });

  const [blogList, setBlogList] = useState<any[]>([]);
  const [newBlog, setNewBlog] = useState({
    title: '',
    category: 'Insight',
    excerpt: '',
    coverImage: '',
    content: '',
    readTime: '3 mnt'
  });

  const [rateCardList, setRateCardList] = useState<any[]>([]);
  const [newRateCard, setNewRateCard] = useState({
    title: '',
    price: '',
    category: 'Design',
    billingPeriod: 'per proyek',
    description: '',
    deliverables: ''
  });

  const [reviewList, setReviewList] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({
    clientName: '',
    brand: '',
    rating: 5,
    reviewText: '',
    avatarUrl: ''
  });

  const [faqList, setFaqList] = useState<any[]>([]);
  const [newFaq, setNewFaq] = useState({
    question: '',
    answer: '',
    category: 'Umum'
  });

  const [linksList, setLinksList] = useState<any[]>([]);
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    category: 'Utama'
  });

  // Media Modal state
  const [galleryTarget, setGalleryTarget] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Full CRUD 2.0 state (inline edit, search filter, & expand toggle per collection)
  const linksRawContainerRef = useRef<any>(null);
  const [editingIds, setEditingIds] = useState<Record<string, string | null>>({
    portfolio: null,
    catalog: null,
    blog: null,
    ratecard: null,
    reviews: null,
    faq: null,
    links: null
  });
  const [collectionSearch, setCollectionSearch] = useState<Record<string, string>>({});
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});

  const saveLinksToStorage = async (nextList: any[]) => {
    if (linksRawContainerRef.current && typeof linksRawContainerRef.current === 'object' && !Array.isArray(linksRawContainerRef.current)) {
      const updatedContainer = { ...linksRawContainerRef.current, links: nextList };
      linksRawContainerRef.current = updatedContainer;
      await storage.setItem('porto_links', updatedContainer, true);
    } else {
      await storage.setItem('porto_links', nextList, true);
    }
  };

  // Load all databases
  const loadAllDatabases = async () => {
    setLoading(true);
    try {
      const [
        pData,
        bioData,
        portData,
        catData,
        blogData,
        rateData,
        revData,
        faqData,
        lnkData
      ] = await Promise.all([
        storage.getItem<BusinessProfile>(BUSINESS_PROFILE_STORAGE_KEY, DEFAULT_BUSINESS_PROFILE),
        storage.getItem<any>('porto_biodata', null),
        storage.getItem<any[]>('porto_portfolio', []),
        storage.getItem<any[]>('porto_catalog_products', []),
        storage.getItem<any[]>('porto_blog_posts', []),
        storage.getItem<any[]>('porto_rate_cards', []),
        storage.getItem<any[]>('porto_client_reviews', []),
        storage.getItem<any[]>('porto_client_faqs', []),
        storage.getItem<any>('porto_links', [])
      ]);

      const cachedMode = typeof localStorage !== 'undefined' ? localStorage.getItem('porto_site_mode') : null;
      if (cachedMode === 'company' || cachedMode === 'personal') {
        setEntityMode(cachedMode);
        setActiveSection(cachedMode === 'company' ? 'company_identity' : 'personal_identity');
      }

      if (pData) {
        setProfile(pData);
        if (!cachedMode && (pData as any).entityMode) {
          setEntityMode((pData as any).entityMode);
          setActiveSection((pData as any).entityMode === 'company' ? 'company_identity' : 'personal_identity');
        }
        if ((pData as any).companyExtra) {
          setCompanyExtra(prev => ({ ...prev, ...(pData as any).companyExtra }));
        }
      }

      if (bioData) {
        setBiodata(prev => ({
          ...prev,
          ...bioData,
          avatarUrl: bioData.avatarUrl || bioData.avatar || prev.avatarUrl || '',
          coverUrl: bioData.coverUrl || prev.coverUrl || '',
          skills: Array.isArray(bioData.skills) ? bioData.skills : prev.skills,
          languages: Array.isArray(bioData.languages) ? bioData.languages : prev.languages,
          education: Array.isArray(bioData.education) ? bioData.education : prev.education,
          experiences: Array.isArray(bioData.experiences) ? bioData.experiences : prev.experiences,
          organizations: Array.isArray(bioData.organizations) ? bioData.organizations : prev.organizations,
          certifications: Array.isArray(bioData.certifications) ? bioData.certifications : prev.certifications,
          socialLinks: { ...(prev.socialLinks || {}), ...(bioData.socialLinks || {}) }
        }));
      }

      if (Array.isArray(portData)) setPortfolioList(portData);
      if (Array.isArray(catData)) setCatalogList(catData);
      if (Array.isArray(blogData)) setBlogList(blogData);
      if (Array.isArray(rateData)) setRateCardList(rateData);
      if (Array.isArray(revData)) setReviewList(revData);
      if (Array.isArray(faqData)) setFaqList(faqData);
      if (Array.isArray(lnkData)) {
        linksRawContainerRef.current = null;
        setLinksList(lnkData);
      } else if (lnkData && typeof lnkData === 'object' && Array.isArray(lnkData.links)) {
        linksRawContainerRef.current = lnkData;
        setLinksList(lnkData.links);
      }
    } catch (err) {
      console.error('Failed to load databases:', err);
      notify('Gagal memuat database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllDatabases();

    const handleSync = (e: any) => {
      if (e.detail) setProfile(e.detail);
    };
    window.addEventListener('porto_business_profile_updated', handleSync);
    return () => window.removeEventListener('porto_business_profile_updated', handleSync);
  }, []);

  const handleChangeMode = (mode: 'company' | 'personal') => {
    setEntityMode(mode);
    setHasProfileChanges(true);
    setActiveSection(mode === 'company' ? 'company_identity' : 'personal_identity');
    setGlobalSiteMode(mode).catch(() => {});
    notify(`Mode aktif: ${mode === 'company' ? 'Studio' : 'Personal'}`, 'info');
  };

  const handleSaveProfile = async (sectionName: string = 'Profil') => {
    try {
      const studioBrandName = (profile.brandName || '').trim() || 'sumr.day Studio';
      const personalFullName = (biodata.fullName || '').trim() || 'Creative Director';

      const profilePayload: any = {
        ...profile,
        brandName: studioBrandName,
        tagline: profile.tagline || biodata.bio,
        description: profile.description || biodata.fullBio,
        address: profile.address || biodata.location,
        entityMode,
        companyExtra: {
          ...companyExtra,
          foundedYear: companyExtra.establishedYear
        },
        personalBiodata: {
          fullName: personalFullName,
          headline: biodata.role,
          bio: biodata.bio,
          fullBio: biodata.fullBio,
          avatar: biodata.avatarUrl,
          coverUrl: biodata.coverUrl
        }
      };

      const res = await syncUnifiedStudioData(profilePayload, sectionName);

      const biodataPayload = {
        ...biodata,
        fullName: personalFullName,
        avatar: biodata.avatarUrl,
        company: studioBrandName || biodata.company,
        phone: profile.whatsapp,
        email: profile.email,
        website: profile.websiteUrl || biodata.website,
        location: biodata.location || profile.address || profile.city
      };
      await storage.setItem('porto_biodata', biodataPayload, true);

      const s = await storage.getItem<any>('porto_settings', {});
      if (s && typeof s === 'object') {
        await storage.setItem('porto_settings', { ...s, biodata: biodataPayload }, true);
      }

      window.dispatchEvent(new CustomEvent('porto_biodata_updated', { detail: biodataPayload }));

      setHasProfileChanges(false);
      if (res && res.notificationText) {
        notify(res.notificationText, 'success');
      } else {
        notify('Data tersimpan', 'success');
      }
    } catch (err) {
      console.error(err);
      notify('Gagal menyimpan', 'error');
    }
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      await handleSaveProfile('Seluruh Database');
      await Promise.all([
        storage.setItem('porto_portfolio', portfolioList, true),
        storage.setItem('porto_catalog_products', catalogList, true),
        storage.setItem('porto_blog_posts', blogList, true),
        storage.setItem('porto_rate_cards', rateCardList, true),
        storage.setItem('porto_client_reviews', reviewList, true),
        storage.setItem('porto_client_faqs', faqList, true),
        saveLinksToStorage(linksList)
      ]);
      setHasProfileChanges(false);
      notify('Semua data berhasil disimpan', 'success');
    } catch (err: any) {
      console.error('Error saving all:', err);
      notify('Gagal menyimpan data', 'error');
    } finally {
      setIsSavingAll(false);
    }
  };

  // Banking
  const handleAddBank = (presetName: string = 'BCA') => {
    const preset = BANK_PRESETS.find(p => p.name === presetName) || BANK_PRESETS[0];
    const defaultHolder = entityMode === 'company'
      ? (profile.brandName || 'SUMR DAY STUDIO')
      : (biodata.fullName || 'ARIF DARMAWAN');

    const newBank: BankAccount = {
      id: `bank_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      bankName: preset.name,
      accountNumber: '',
      accountName: defaultHolder,
      color: preset.color
    };
    setProfile(p => ({ ...p, bankAccounts: [...(p.bankAccounts || []), newBank] }));
    setHasProfileChanges(true);
  };

  const handleRemoveBank = async (id: string) => {
    if (await showConfirm('Hapus rekening ini?')) {
      setProfile(p => ({ ...p, bankAccounts: (p.bankAccounts || []).filter(b => b.id !== id) }));
      setHasProfileChanges(true);
    }
  };

  const moveItem = (arr: any[], index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= arr.length) return arr;
    const copy = [...arr];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    return copy;
  };

  // Skills
  const handleAddSkill = (preset?: { name: string; description: string }) => {
    const nameToAdd = preset ? preset.name : newSkillInput.name.trim();
    const descToAdd = preset ? preset.description : newSkillInput.description.trim();
    if (!nameToAdd) return;

    const exists = biodata.skills.some(s => getSkillName(s).toLowerCase() === nameToAdd.toLowerCase());
    if (exists) {
      notify(`Keahlian sudah ada`, 'info');
      return;
    }

    const newSkillObj = {
      id: `sk_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: nameToAdd,
      description: descToAdd
    };

    setBiodata(prev => ({ ...prev, skills: [...prev.skills, newSkillObj] }));
    if (!preset) setNewSkillInput({ name: '', description: '' });
    setHasProfileChanges(true);
  };

  const handleRemoveSkill = (index: number) => {
    setBiodata(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));
    setHasProfileChanges(true);
  };

  const handleMoveSkill = (index: number, direction: -1 | 1) => {
    setBiodata(prev => ({ ...prev, skills: moveItem(prev.skills, index, direction) }));
    setHasProfileChanges(true);
  };

  const handleUpdateSkillDesc = (index: number, newDesc: string) => {
    setBiodata(prev => {
      const updated = [...prev.skills];
      const cur = updated[index];
      if (typeof cur === 'string') {
        updated[index] = { id: `sk_${index}`, name: cur, description: newDesc };
      } else {
        updated[index] = { ...cur, description: newDesc };
      }
      return { ...prev, skills: updated };
    });
    setHasProfileChanges(true);
  };

  // Languages
  const handleAddLanguage = (preset?: string) => {
    const lang = preset || newLangInput.trim();
    if (!lang) return;
    if (biodata.languages.includes(lang)) {
      notify(`Bahasa sudah ada`, 'info');
      return;
    }
    setBiodata(prev => ({ ...prev, languages: [...prev.languages, lang] }));
    if (!preset) setNewLangInput('');
    setHasProfileChanges(true);
  };

  const handleRemoveLanguage = (index: number) => {
    setBiodata(prev => ({ ...prev, languages: prev.languages.filter((_, i) => i !== index) }));
    setHasProfileChanges(true);
  };

  const handleMoveLanguage = (index: number, direction: -1 | 1) => {
    setBiodata(prev => ({ ...prev, languages: moveItem(prev.languages, index, direction) }));
    setHasProfileChanges(true);
  };

  // Education
  const handleAddEducation = () => {
    const newEdu = { institution: '', degree: '', startYear: '2020', endYear: '2024', description: '' };
    setBiodata(prev => ({ ...prev, education: [...(prev.education || []), newEdu] }));
    setHasProfileChanges(true);
  };

  const handleRemoveEducation = (index: number) => {
    setBiodata(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));
    setHasProfileChanges(true);
  };

  const handleMoveEducation = (index: number, direction: -1 | 1) => {
    setBiodata(prev => ({ ...prev, education: moveItem(prev.education, index, direction) }));
    setHasProfileChanges(true);
  };

  const handleUpdateEducation = (index: number, field: string, value: string) => {
    setBiodata(prev => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
    setHasProfileChanges(true);
  };

  // Experience
  const handleAddExperience = () => {
    const newExp = { company: '', role: '', startYear: '2023', endYear: 'Sekarang', description: '' };
    setBiodata(prev => ({ ...prev, experiences: [...(prev.experiences || []), newExp] }));
    setHasProfileChanges(true);
  };

  const handleRemoveExperience = (index: number) => {
    setBiodata(prev => ({ ...prev, experiences: prev.experiences.filter((_, i) => i !== index) }));
    setHasProfileChanges(true);
  };

  const handleMoveExperience = (index: number, direction: -1 | 1) => {
    setBiodata(prev => ({ ...prev, experiences: moveItem(prev.experiences, index, direction) }));
    setHasProfileChanges(true);
  };

  const handleUpdateExperience = (index: number, field: string, value: string) => {
    setBiodata(prev => {
      const updated = [...prev.experiences];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, experiences: updated };
    });
    setHasProfileChanges(true);
  };

  // Organization
  const handleAddOrganization = () => {
    const newOrg = { name: '', role: '', startYear: '2022', endYear: 'Sekarang', description: '' };
    setBiodata(prev => ({ ...prev, organizations: [...(prev.organizations || []), newOrg] }));
    setHasProfileChanges(true);
  };

  const handleRemoveOrganization = (index: number) => {
    setBiodata(prev => ({ ...prev, organizations: prev.organizations.filter((_, i) => i !== index) }));
    setHasProfileChanges(true);
  };

  const handleMoveOrganization = (index: number, direction: -1 | 1) => {
    setBiodata(prev => ({ ...prev, organizations: moveItem(prev.organizations, index, direction) }));
    setHasProfileChanges(true);
  };

  const handleUpdateOrganization = (index: number, field: string, value: string) => {
    setBiodata(prev => {
      const updated = [...prev.organizations];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, organizations: updated };
    });
    setHasProfileChanges(true);
  };

  // Certification
  const handleAddCertification = () => {
    const newCert = { name: '', issuer: '', year: new Date().getFullYear().toString(), credentialUrl: '' };
    setBiodata(prev => ({ ...prev, certifications: [...(prev.certifications || []), newCert] }));
    setHasProfileChanges(true);
  };

  const handleRemoveCertification = (index: number) => {
    setBiodata(prev => ({ ...prev, certifications: prev.certifications.filter((_, i) => i !== index) }));
    setHasProfileChanges(true);
  };

  const handleMoveCertification = (index: number, direction: -1 | 1) => {
    setBiodata(prev => ({ ...prev, certifications: moveItem(prev.certifications, index, direction) }));
    setHasProfileChanges(true);
  };

  const handleUpdateCertification = (index: number, field: string, value: string) => {
    setBiodata(prev => {
      const updated = [...prev.certifications];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, certifications: updated };
    });
    setHasProfileChanges(true);
  };

  // Portfolio
  const handleEditPortfolio = (item: any) => {
    setEditingIds(prev => ({ ...prev, portfolio: item.id }));
    setNewPortfolio({
      title: item.title || item.name || '',
      category: item.category || 'Branding',
      description: item.description || '',
      image: item.image || item.coverImage || '',
      link: item.link || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '')
    });
  };

  const handleCancelEditPortfolio = () => {
    setEditingIds(prev => ({ ...prev, portfolio: null }));
    setNewPortfolio({ title: '', category: 'Branding', description: '', image: '', link: '', tags: '' });
  };

  const handleAddPortfolio = async () => {
    if (!newPortfolio.title.trim()) {
      notify('Judul wajib diisi', 'error');
      return;
    }
    const editId = editingIds.portfolio;
    let nextList: any[];
    if (editId) {
      nextList = portfolioList.map(p => p.id === editId ? {
        ...p,
        title: newPortfolio.title.trim(),
        name: newPortfolio.title.trim(),
        category: newPortfolio.category,
        description: newPortfolio.description,
        image: newPortfolio.image,
        coverImage: newPortfolio.image,
        link: newPortfolio.link,
        tags: newPortfolio.tags.split(',').map(t => t.trim()).filter(Boolean),
        updatedAt: new Date().toISOString()
      } : p);
    } else {
      const item = {
        id: `port_${Date.now()}`,
        title: newPortfolio.title.trim(),
        name: newPortfolio.title.trim(),
        category: newPortfolio.category,
        description: newPortfolio.description,
        image: newPortfolio.image,
        coverImage: newPortfolio.image,
        link: newPortfolio.link,
        tags: newPortfolio.tags.split(',').map(t => t.trim()).filter(Boolean),
        createdAt: new Date().toISOString()
      };
      nextList = [item, ...portfolioList];
    }
    setPortfolioList(nextList);
    await storage.setItem('porto_portfolio', nextList, true);
    window.dispatchEvent(new CustomEvent('porto_portfolio_updated', { detail: nextList }));
    setEditingIds(prev => ({ ...prev, portfolio: null }));
    setNewPortfolio({ title: '', category: 'Branding', description: '', image: '', link: '', tags: '' });
    notify(editId ? 'Karya diperbarui' : 'Karya ditambahkan', 'success');
  };

  const handleRemovePortfolio = async (id: string) => {
    if (await showConfirm('Hapus karya ini?')) {
      const nextList = portfolioList.filter(p => p.id !== id);
      setPortfolioList(nextList);
      if (editingIds.portfolio === id) handleCancelEditPortfolio();
      await storage.setItem('porto_portfolio', nextList, true);
      window.dispatchEvent(new CustomEvent('porto_portfolio_updated', { detail: nextList }));
      notify('Karya dihapus', 'info');
    }
  };

  // Product
  const handleEditProduct = (item: any) => {
    setEditingIds(prev => ({ ...prev, catalog: item.id }));
    setNewProduct({
      name: item.name || item.title || '',
      price: String(item.price || ''),
      category: item.category || 'Digital',
      type: item.type || 'digital',
      description: item.description || '',
      image: item.image || '',
      stock: Number(item.stock) || 99
    });
  };

  const handleCancelEditProduct = () => {
    setEditingIds(prev => ({ ...prev, catalog: null }));
    setNewProduct({ name: '', price: '', category: 'Digital', type: 'digital', description: '', image: '', stock: 99 });
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) {
      notify('Nama produk wajib diisi', 'error');
      return;
    }
    const editId = editingIds.catalog;
    let nextList: any[];
    if (editId) {
      nextList = catalogList.map(p => p.id === editId ? {
        ...p,
        name: newProduct.name.trim(),
        price: Number(String(newProduct.price).replace(/[^0-9]/g, '')) || 0,
        category: newProduct.category,
        type: newProduct.type,
        description: newProduct.description,
        image: newProduct.image,
        stock: Number(newProduct.stock) || 99,
        updatedAt: new Date().toISOString()
      } : p);
    } else {
      const item = {
        id: `prod_${Date.now()}`,
        name: newProduct.name.trim(),
        price: Number(String(newProduct.price).replace(/[^0-9]/g, '')) || 0,
        category: newProduct.category,
        type: newProduct.type,
        description: newProduct.description,
        image: newProduct.image,
        stock: Number(newProduct.stock) || 99,
        active: true,
        createdAt: new Date().toISOString()
      };
      nextList = [item, ...catalogList];
    }
    setCatalogList(nextList);
    await storage.setItem('porto_catalog_products', nextList, true);
    window.dispatchEvent(new CustomEvent('porto_catalog_products_updated', { detail: nextList }));
    setEditingIds(prev => ({ ...prev, catalog: null }));
    setNewProduct({ name: '', price: '', category: 'Digital', type: 'digital', description: '', image: '', stock: 99 });
    notify(editId ? 'Produk diperbarui' : 'Produk ditambahkan', 'success');
  };

  const handleRemoveProduct = async (id: string) => {
    if (await showConfirm('Hapus produk ini?')) {
      const nextList = catalogList.filter(p => p.id !== id);
      setCatalogList(nextList);
      if (editingIds.catalog === id) handleCancelEditProduct();
      await storage.setItem('porto_catalog_products', nextList, true);
      window.dispatchEvent(new CustomEvent('porto_catalog_products_updated', { detail: nextList }));
      notify('Produk dihapus', 'info');
    }
  };

  // Blog
  const handleEditBlog = (item: any) => {
    setEditingIds(prev => ({ ...prev, blog: item.id }));
    setNewBlog({
      title: item.title || '',
      category: item.category || 'Insight',
      excerpt: item.excerpt || item.content || '',
      coverImage: item.coverImage || item.image || '',
      content: item.content || item.excerpt || '',
      readTime: item.readTime || '3 mnt'
    });
  };

  const handleCancelEditBlog = () => {
    setEditingIds(prev => ({ ...prev, blog: null }));
    setNewBlog({ title: '', category: 'Insight', excerpt: '', coverImage: '', content: '', readTime: '3 mnt' });
  };

  const handleAddBlog = async () => {
    if (!newBlog.title.trim()) {
      notify('Judul artikel wajib diisi', 'error');
      return;
    }
    const editId = editingIds.blog;
    let nextList: any[];
    if (editId) {
      nextList = blogList.map(b => b.id === editId ? {
        ...b,
        title: newBlog.title.trim(),
        category: newBlog.category,
        excerpt: newBlog.excerpt,
        coverImage: newBlog.coverImage,
        content: newBlog.content || newBlog.excerpt,
        readTime: newBlog.readTime || '3 mnt',
        updatedAt: new Date().toISOString()
      } : b);
    } else {
      const item = {
        id: `blog_${Date.now()}`,
        title: newBlog.title.trim(),
        category: newBlog.category,
        excerpt: newBlog.excerpt,
        coverImage: newBlog.coverImage,
        content: newBlog.content || newBlog.excerpt,
        readTime: newBlog.readTime || '3 mnt',
        published: true,
        createdAt: new Date().toISOString()
      };
      nextList = [item, ...blogList];
    }
    setBlogList(nextList);
    await storage.setItem('porto_blog_posts', nextList, true);
    window.dispatchEvent(new CustomEvent('porto_blog_updated', { detail: nextList }));
    setEditingIds(prev => ({ ...prev, blog: null }));
    setNewBlog({ title: '', category: 'Insight', excerpt: '', coverImage: '', content: '', readTime: '3 mnt' });
    notify(editId ? 'Artikel diperbarui' : 'Artikel ditambahkan', 'success');
  };

  const handleRemoveBlog = async (id: string) => {
    if (await showConfirm('Hapus artikel ini?')) {
      const nextList = blogList.filter(b => b.id !== id);
      setBlogList(nextList);
      if (editingIds.blog === id) handleCancelEditBlog();
      await storage.setItem('porto_blog_posts', nextList, true);
      window.dispatchEvent(new CustomEvent('porto_blog_updated', { detail: nextList }));
      notify('Artikel dihapus', 'info');
    }
  };

  // Ratecard
  const handleEditRateCard = (item: any) => {
    setEditingIds(prev => ({ ...prev, ratecard: item.id }));
    setNewRateCard({
      title: item.title || item.name || '',
      price: String(item.price || ''),
      category: item.category || 'Design',
      billingPeriod: item.billingPeriod || 'per proyek',
      description: item.description || '',
      deliverables: Array.isArray(item.deliverables) ? item.deliverables.join('\n') : (item.deliverables || '')
    });
  };

  const handleCancelEditRateCard = () => {
    setEditingIds(prev => ({ ...prev, ratecard: null }));
    setNewRateCard({ title: '', price: '', category: 'Design', billingPeriod: 'per proyek', description: '', deliverables: '' });
  };

  const handleAddRateCard = async () => {
    if (!newRateCard.title.trim()) {
      notify('Nama paket wajib diisi', 'error');
      return;
    }
    const editId = editingIds.ratecard;
    let nextList: any[];
    if (editId) {
      nextList = rateCardList.map(r => r.id === editId ? {
        ...r,
        title: newRateCard.title.trim(),
        price: Number(String(newRateCard.price).replace(/[^0-9]/g, '')) || 0,
        category: newRateCard.category,
        billingPeriod: newRateCard.billingPeriod,
        description: newRateCard.description,
        deliverables: newRateCard.deliverables.split('\n').map(d => d.trim()).filter(Boolean),
        updatedAt: new Date().toISOString()
      } : r);
    } else {
      const item = {
        id: `rate_${Date.now()}`,
        title: newRateCard.title.trim(),
        price: Number(String(newRateCard.price).replace(/[^0-9]/g, '')) || 0,
        category: newRateCard.category,
        billingPeriod: newRateCard.billingPeriod,
        description: newRateCard.description,
        deliverables: newRateCard.deliverables.split('\n').map(d => d.trim()).filter(Boolean),
        isActive: true,
        createdAt: new Date().toISOString()
      };
      nextList = [item, ...rateCardList];
    }
    setRateCardList(nextList);
    await storage.setItem('porto_rate_cards', nextList, true);
    window.dispatchEvent(new CustomEvent('porto_ratecards_updated', { detail: nextList }));
    setEditingIds(prev => ({ ...prev, ratecard: null }));
    setNewRateCard({ title: '', price: '', category: 'Design', billingPeriod: 'per proyek', description: '', deliverables: '' });
    notify(editId ? 'Paket tarif diperbarui' : 'Paket tarif disimpan', 'success');
  };

  const handleRemoveRateCard = async (id: string) => {
    if (await showConfirm('Hapus paket ini?')) {
      const nextList = rateCardList.filter(r => r.id !== id);
      setRateCardList(nextList);
      if (editingIds.ratecard === id) handleCancelEditRateCard();
      await storage.setItem('porto_rate_cards', nextList, true);
      window.dispatchEvent(new CustomEvent('porto_ratecards_updated', { detail: nextList }));
      notify('Paket dihapus', 'info');
    }
  };

  // Review
  const handleEditReview = (item: any) => {
    setEditingIds(prev => ({ ...prev, reviews: item.id }));
    setNewReview({
      clientName: item.clientName || item.author || item.name || '',
      brand: item.brand || item.role || item.company || '',
      rating: Number(item.rating) || 5,
      reviewText: item.reviewText || item.quote || item.comment || '',
      avatarUrl: item.avatarUrl || item.avatar || ''
    });
  };

  const handleCancelEditReview = () => {
    setEditingIds(prev => ({ ...prev, reviews: null }));
    setNewReview({ clientName: '', brand: '', rating: 5, reviewText: '', avatarUrl: '' });
  };

  const handleAddReview = async () => {
    if (!newReview.clientName.trim() || !newReview.reviewText.trim()) {
      notify('Nama klien dan testimoni wajib diisi', 'error');
      return;
    }
    const editId = editingIds.reviews;
    let nextList: any[];
    if (editId) {
      nextList = reviewList.map(r => r.id === editId ? {
        ...r,
        clientName: newReview.clientName.trim(),
        brand: newReview.brand.trim(),
        rating: Number(newReview.rating) || 5,
        reviewText: newReview.reviewText.trim(),
        avatarUrl: newReview.avatarUrl,
        updatedAt: new Date().toISOString()
      } : r);
    } else {
      const item = {
        id: `rev_${Date.now()}`,
        clientName: newReview.clientName.trim(),
        brand: newReview.brand.trim(),
        rating: Number(newReview.rating) || 5,
        reviewText: newReview.reviewText.trim(),
        avatarUrl: newReview.avatarUrl,
        isPublished: true,
        createdAt: new Date().toISOString()
      };
      nextList = [item, ...reviewList];
    }
    setReviewList(nextList);
    await storage.setItem('porto_client_reviews', nextList, true);
    window.dispatchEvent(new CustomEvent('porto_reviews_updated', { detail: nextList }));
    setEditingIds(prev => ({ ...prev, reviews: null }));
    setNewReview({ clientName: '', brand: '', rating: 5, reviewText: '', avatarUrl: '' });
    notify(editId ? 'Ulasan diperbarui' : 'Ulasan ditambahkan', 'success');
  };

  const handleRemoveReview = async (id: string) => {
    if (await showConfirm('Hapus ulasan ini?')) {
      const nextList = reviewList.filter(r => r.id !== id);
      setReviewList(nextList);
      if (editingIds.reviews === id) handleCancelEditReview();
      await storage.setItem('porto_client_reviews', nextList, true);
      window.dispatchEvent(new CustomEvent('porto_reviews_updated', { detail: nextList }));
      notify('Ulasan dihapus', 'info');
    }
  };

  // FAQ
  const handleEditFaq = (item: any) => {
    setEditingIds(prev => ({ ...prev, faq: item.id }));
    setNewFaq({
      question: item.question || '',
      answer: item.answer || '',
      category: item.category || 'Umum'
    });
  };

  const handleCancelEditFaq = () => {
    setEditingIds(prev => ({ ...prev, faq: null }));
    setNewFaq({ question: '', answer: '', category: 'Umum' });
  };

  const handleAddFaq = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      notify('Pertanyaan dan jawaban wajib diisi', 'error');
      return;
    }
    const editId = editingIds.faq;
    let nextList: any[];
    if (editId) {
      nextList = faqList.map(f => f.id === editId ? {
        ...f,
        question: newFaq.question.trim(),
        answer: newFaq.answer.trim(),
        category: newFaq.category
      } : f);
    } else {
      const item = {
        id: `faq_${Date.now()}`,
        question: newFaq.question.trim(),
        answer: newFaq.answer.trim(),
        category: newFaq.category
      };
      nextList = [item, ...faqList];
    }
    setFaqList(nextList);
    await storage.setItem('porto_client_faqs', nextList, true);
    window.dispatchEvent(new CustomEvent('porto_faqs_updated', { detail: nextList }));
    setEditingIds(prev => ({ ...prev, faq: null }));
    setNewFaq({ question: '', answer: '', category: 'Umum' });
    notify(editId ? 'FAQ diperbarui' : 'FAQ ditambahkan', 'success');
  };

  const handleRemoveFaq = async (id: string) => {
    if (await showConfirm('Hapus FAQ ini?')) {
      const nextList = faqList.filter(f => f.id !== id);
      setFaqList(nextList);
      if (editingIds.faq === id) handleCancelEditFaq();
      await storage.setItem('porto_client_faqs', nextList, true);
      window.dispatchEvent(new CustomEvent('porto_faqs_updated', { detail: nextList }));
      notify('FAQ dihapus', 'info');
    }
  };

  // Link
  const handleEditLink = (item: any) => {
    setEditingIds(prev => ({ ...prev, links: item.id }));
    setNewLink({
      title: item.title || item.label || '',
      url: item.url || '',
      category: item.category || 'Utama'
    });
  };

  const handleCancelEditLink = () => {
    setEditingIds(prev => ({ ...prev, links: null }));
    setNewLink({ title: '', url: '', category: 'Utama' });
  };

  const handleAddLink = async () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      notify('Judul dan URL wajib diisi', 'error');
      return;
    }
    const normalizedUrl = newLink.url.trim().startsWith('http') ? newLink.url.trim() : `https://${newLink.url.trim()}`;
    const editId = editingIds.links;
    let nextList: any[];
    if (editId) {
      nextList = linksList.map(l => l.id === editId ? {
        ...l,
        title: newLink.title.trim(),
        url: normalizedUrl,
        category: newLink.category
      } : l);
    } else {
      const item = {
        id: `lnk_${Date.now()}`,
        title: newLink.title.trim(),
        url: normalizedUrl,
        category: newLink.category,
        active: true
      };
      nextList = [item, ...linksList];
    }
    setLinksList(nextList);
    await saveLinksToStorage(nextList);
    setEditingIds(prev => ({ ...prev, links: null }));
    setNewLink({ title: '', url: '', category: 'Utama' });
    notify(editId ? 'Tautan diperbarui' : 'Tautan ditambahkan', 'success');
  };

  const handleRemoveLink = async (id: string) => {
    if (await showConfirm('Hapus tautan ini?')) {
      const nextList = linksList.filter(l => l.id !== id);
      setLinksList(nextList);
      if (editingIds.links === id) handleCancelEditLink();
      await saveLinksToStorage(nextList);
      notify('Tautan dihapus', 'info');
    }
  };

  // Reusable renderer for collection list with inline Edit, Search, and Expand All
  const renderCollectionItems = (
    collectionKey: string,
    items: any[],
    getLabel: (item: any) => string,
    getSubLabel: ((item: any) => string) | null,
    onEdit: (item: any) => void,
    onDelete: (id: string) => void
  ) => {
    if (!items || items.length === 0) return null;
    const query = (collectionSearch[collectionKey] || '').trim().toLowerCase();
    const filtered = query
      ? items.filter(it =>
          getLabel(it).toLowerCase().includes(query) ||
          (getSubLabel ? getSubLabel(it).toLowerCase().includes(query) : false)
        )
      : items;
    const isExpanded = !!expandedCollections[collectionKey];
    const visibleItems = isExpanded ? filtered : filtered.slice(0, 8);
    const activeEditId = editingIds[collectionKey];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
        {items.length > 5 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 260 }}>
              <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder={`Cari dari ${items.length} item...`}
                value={collectionSearch[collectionKey] || ''}
                onChange={e => setCollectionSearch(prev => ({ ...prev, [collectionKey]: e.target.value }))}
                className="cms-input"
                style={{ width: '100%', height: 28, borderRadius: 6, paddingLeft: 26, fontSize: 11, boxSizing: 'border-box' }}
              />
            </div>
            {filtered.length > 8 && (
              <button
                type="button"
                onClick={() => setExpandedCollections(prev => ({ ...prev, [collectionKey]: !isExpanded }))}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 6,
                  padding: '3px 8px',
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: 'var(--cms-text-muted)',
                  cursor: 'pointer'
                }}
              >
                {isExpanded ? 'Ringkas' : `Lihat Semua (${filtered.length})`}
              </button>
            )}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {visibleItems.map((item) => {
            const isEditing = activeEditId === item.id;
            const sub = getSubLabel ? getSubLabel(item) : '';
            return (
              <div
                key={item.id}
                style={{
                  padding: '4px 9px',
                  borderRadius: 7,
                  background: isEditing ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255,255,255,0.03)',
                  border: isEditing ? '1px solid #10b981' : '1px solid var(--glass-border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  title="Klik untuk edit item ini"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isEditing ? '#10b981' : 'inherit',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700
                  }}
                >
                  <span>{getLabel(item)}</span>
                  {sub && (
                    <span style={{ fontSize: 10, opacity: 0.6, fontWeight: 600 }}>({sub})</span>
                  )}
                  <Edit3 size={10} style={{ opacity: 0.65 }} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  title="Hapus"
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Section tabs configuration: 1-WORD LABELS ONLY
  const sectionsConfig = [
    { id: 'company_identity', label: 'Studio', icon: Building2, count: null },
    { id: 'personal_identity', label: 'Profil', icon: User, count: null },
    {
      id: 'skills_history',
      label: 'Keahlian',
      icon: GraduationCap,
      count: (biodata.skills?.length || 0) + (biodata.experiences?.length || 0) + (biodata.education?.length || 0)
    },
    { id: 'banking', label: 'Rekening', icon: CreditCard, count: profile.bankAccounts?.length || 0 },
    { id: 'contact', label: 'Kontak', icon: Phone, count: null },
    { id: 'socials', label: 'Sosmed', icon: Globe, count: Object.values(profile.socials || {}).filter(Boolean).length },
    { id: 'portfolio', label: 'Karya', icon: Star, count: portfolioList.length },
    { id: 'catalog', label: 'Produk', icon: ShoppingBag, count: catalogList.length },
    { id: 'blog', label: 'Artikel', icon: BookOpen, count: blogList.length },
    { id: 'ratecard', label: 'Tarif', icon: Receipt, count: rateCardList.length },
    { id: 'reviews', label: 'Ulasan', icon: Quote, count: reviewList.length },
    { id: 'faq', label: 'FAQ', icon: HelpCircle, count: faqList.length },
    { id: 'links', label: 'Tautan', icon: Link2, count: linksList.length },
    { id: 'all', label: 'Semua', icon: LayoutList, count: null },
  ];

  const shouldRenderSection = (sectionId: MasterSection) => {
    if (activeSection === 'all') return true;
    return activeSection === sectionId;
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100%',
      boxSizing: 'border-box',
      padding: '8px clamp(6px, 2vw, 20px) 80px',
      color: 'var(--cms-text, #ffffff)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      overflowX: 'hidden'
    }}>
      <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14, width: '100%', boxSizing: 'border-box' }}>

        {/* ── TOP HEADER (MINIMALIS & ELEGAN) ── */}
        <div style={{
          background: 'var(--cms-card-bg, rgba(255,255,255,0.03))',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
          borderRadius: 16,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Sisi Kiri: Back & Title */}
          <div className="hub-back-header-left" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                title="Kembali"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                  background: 'transparent',
                  color: 'var(--cms-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={15} />
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'rgba(217, 86, 41, 0.15)',
                color: 'var(--cms-accent, #D95629)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Database size={15} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em' }}>
                Form Terpadu
              </span>
            </div>
          </div>

          {/* Sisi Kanan: Switcher Mode + Save + Icon-Only Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Mode Switcher Segmented */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: 2,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.08))'
            }}>
              <button
                type="button"
                onClick={() => handleChangeMode('company')}
                title="Mode Studio"
                style={{
                  padding: '4px 9px',
                  borderRadius: 8,
                  border: 'none',
                  background: entityMode === 'company' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  color: entityMode === 'company' ? '#fbbf24' : 'var(--cms-text-muted)',
                  fontWeight: entityMode === 'company' ? 800 : 600,
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Building2 size={12} />
                <span>Studio</span>
              </button>
              <button
                type="button"
                onClick={() => handleChangeMode('personal')}
                title="Mode Personal"
                style={{
                  padding: '4px 9px',
                  borderRadius: 8,
                  border: 'none',
                  background: entityMode === 'personal' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                  color: entityMode === 'personal' ? '#c084fc' : 'var(--cms-text-muted)',
                  fontWeight: entityMode === 'personal' ? 800 : 600,
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <User size={12} />
                <span>Personal</span>
              </button>
            </div>

            {/* Simpan Global Button */}
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSavingAll}
              title="Simpan Data"
              style={{
                height: 32,
                padding: '0 12px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'var(--cms-accent, #D95629)',
                color: '#fff',
                border: 'none',
                cursor: isSavingAll ? 'wait' : 'pointer',
                position: 'relative'
              }}
            >
              {isSavingAll ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
              <span>{isSavingAll ? '...' : 'Simpan'}</span>
              {hasProfileChanges && (
                <span style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#fbbf24',
                  position: 'absolute',
                  top: 4,
                  right: 4
                }} />
              )}
            </button>
          </div>
        </div>

        {/* ── SECTION SELECTOR (ICON ONLY - CENTERED & NO CROPPING) ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 8,
          padding: '12px 6px',
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'visible'
        }}>
          {sectionsConfig.map(s => {
            const Icon = s.icon;
            const isActive = activeSection === s.id;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id as MasterSection)}
                title={s.label}
                aria-label={s.label}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  background: isActive ? 'var(--cms-accent, #D95629)' : 'var(--cms-card-bg, rgba(255,255,255,0.03))',
                  color: isActive ? '#fff' : 'var(--cms-text-muted, #94a3b8)',
                  border: '1px solid ' + (isActive ? 'var(--cms-accent, #D95629)' : 'var(--glass-border, rgba(255,255,255,0.08))'),
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isActive ? '0 4px 12px rgba(var(--cms-accent-rgb, 217, 86, 41), 0.35)' : 'none',
                  overflow: 'visible'
                }}
              >
                <Icon size={17} />
                {s.count !== null && s.count > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    minWidth: 16,
                    height: 16,
                    padding: '0 4px',
                    borderRadius: 999,
                    fontSize: 9,
                    fontWeight: 800,
                    lineHeight: '16px',
                    background: isActive ? '#fff' : 'var(--cms-accent, #D95629)',
                    color: isActive ? 'var(--cms-accent, #D95629)' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.18)',
                    zIndex: 10,
                    pointerEvents: 'none'
                  }}>
                    {s.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            1. STUDIO (PERUSAHAAN)
        ───────────────────────────────────────────────────────────── */}
        {shouldRenderSection('company_identity') && (
          <div style={{
            background: 'var(--cms-card-bg, rgba(255,255,255,0.03))',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: '100%',
            boxSizing: 'border-box'
          }}>
            {/* Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                  <Building2 size={16} />
                </div>
                <div>
                  <span style={{ fontSize: 13.5, fontWeight: 800 }}>Profil Studio</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSaveProfile('Profil Studio')}
                title="Simpan"
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--cms-accent, #D95629)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Save size={14} />
              </button>
            </div>

            {/* Inputs 2-kolom responsif */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Nama Brand</label>
                <input
                  type="text"
                  value={profile.brandName || ''}
                  onChange={e => { setProfile(p => ({ ...p, brandName: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="sumr.day Studio"
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Badan Usaha</label>
                <input
                  type="text"
                  value={companyExtra.legalName}
                  onChange={e => { setCompanyExtra(p => ({ ...p, legalName: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="PT / CV"
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Tagline</label>
                <input
                  type="text"
                  value={profile.tagline || ''}
                  onChange={e => { setProfile(p => ({ ...p, tagline: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="Slogan studio"
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Bidang Usaha</label>
                <input
                  type="text"
                  value={companyExtra.industry}
                  onChange={e => { setCompanyExtra(p => ({ ...p, industry: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="Creative & Web"
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Tahun Berdiri</label>
                <input
                  type="text"
                  value={companyExtra.establishedYear}
                  onChange={e => { setCompanyExtra(p => ({ ...p, establishedYear: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="2024"
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Ukuran Tim</label>
                <input
                  type="text"
                  value={companyExtra.teamSize}
                  onChange={e => { setCompanyExtra(p => ({ ...p, teamSize: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="5-10 Orang"
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Kota</label>
                <input
                  type="text"
                  value={profile.city || ''}
                  onChange={e => { setProfile(p => ({ ...p, city: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="Jakarta Selatan"
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Jam Kerja</label>
                <input
                  type="text"
                  value={profile.operatingHours || ''}
                  onChange={e => { setProfile(p => ({ ...p, operatingHours: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="08.00 - 17.00 WIB"
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Website</label>
                <input
                  type="text"
                  value={profile.websiteUrl || ''}
                  onChange={e => { setProfile(p => ({ ...p, websiteUrl: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="https://sumrday.web.app"
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Logo Studio</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={companyExtra.logoUrl || ''}
                    onChange={e => { setCompanyExtra(p => ({ ...p, logoUrl: e.target.value })); setHasProfileChanges(true); }}
                    placeholder="URL logo studio..."
                    className="cms-input"
                    style={{ flex: 1, height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => { setGalleryTarget('company_logo'); setIsGalleryOpen(true); }}
                    title="Galeri Media"
                    style={{ width: 38, height: 38, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <ImageIcon size={15} />
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Banner / Hero Studio</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={companyExtra.coverUrl || ''}
                    onChange={e => { setCompanyExtra(p => ({ ...p, coverUrl: e.target.value })); setHasProfileChanges(true); }}
                    placeholder="URL banner hero..."
                    className="cms-input"
                    style={{ flex: 1, height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => { setGalleryTarget('company_cover'); setIsGalleryOpen(true); }}
                    title="Galeri Media"
                    style={{ width: 38, height: 38, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <ImageIcon size={15} />
                  </button>
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Alamat</label>
                <textarea
                  value={profile.address || ''}
                  onChange={e => { setProfile(p => ({ ...p, address: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="Alamat kantor fisik..."
                  rows={2}
                  className="cms-input"
                  style={{ width: '100%', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Tentang Studio</label>
                <textarea
                  value={profile.description || ''}
                  onChange={e => { setProfile(p => ({ ...p, description: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="Profil & filosofi studio..."
                  rows={3}
                  className="cms-input"
                  style={{ width: '100%', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            2. PROFIL (PERSONAL / FREELANCE)
        ───────────────────────────────────────────────────────────── */}
        {shouldRenderSection('personal_identity') && (
          <div style={{
            background: 'var(--cms-card-bg, rgba(255,255,255,0.03))',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
                  <User size={16} />
                </div>
                <div>
                  <span style={{ fontSize: 13.5, fontWeight: 800 }}>Biodata Diri</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSaveProfile('Biodata Diri')}
                title="Simpan"
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--cms-accent, #D95629)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Save size={14} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Nama Lengkap</label>
                <input
                  type="text"
                  value={biodata.fullName}
                  onChange={e => { setBiodata(p => ({ ...p, fullName: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="Nama lengkap"
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Panggilan</label>
                <input
                  type="text"
                  value={biodata.nickName}
                  onChange={e => { setBiodata(p => ({ ...p, nickName: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="Nama panggilan"
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Profesi</label>
                <input
                  type="text"
                  value={biodata.role}
                  onChange={e => { setBiodata(p => ({ ...p, role: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="Peran spesialisasi"
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Perusahaan</label>
                <input
                  type="text"
                  value={biodata.company}
                  onChange={e => { setBiodata(p => ({ ...p, company: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="Studio / Kantor"
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Pengalaman</label>
                <input
                  type="text"
                  value={biodata.experienceYears}
                  onChange={e => { setBiodata(p => ({ ...p, experienceYears: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="Contoh: 5 Tahun"
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Domisili</label>
                <input
                  type="text"
                  value={biodata.location}
                  onChange={e => { setBiodata(p => ({ ...p, location: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="Kota tinggal"
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Website</label>
                <input
                  type="text"
                  value={biodata.website}
                  onChange={e => { setBiodata(p => ({ ...p, website: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="https://..."
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Foto Profil</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={biodata.avatarUrl}
                    onChange={e => { setBiodata(p => ({ ...p, avatarUrl: e.target.value })); setHasProfileChanges(true); }}
                    placeholder="URL foto..."
                    className="cms-input"
                    style={{ flex: 1, height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => { setGalleryTarget('avatar'); setIsGalleryOpen(true); }}
                    title="Galeri Media"
                    style={{ width: 38, height: 38, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <ImageIcon size={15} />
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Banner / Sampul Profil</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={biodata.coverUrl || ''}
                    onChange={e => { setBiodata(p => ({ ...p, coverUrl: e.target.value })); setHasProfileChanges(true); }}
                    placeholder="URL sampul profil..."
                    className="cms-input"
                    style={{ flex: 1, height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => { setGalleryTarget('personal_cover'); setIsGalleryOpen(true); }}
                    title="Galeri Media"
                    style={{ width: 38, height: 38, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <ImageIcon size={15} />
                  </button>
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Bio Singkat</label>
                <input
                  type="text"
                  value={biodata.bio}
                  onChange={e => { setBiodata(p => ({ ...p, bio: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="Bio singkat..."
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Cerita Lengkap</label>
                <textarea
                  value={biodata.fullBio}
                  onChange={e => { setBiodata(p => ({ ...p, fullBio: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="Narasi latar belakang..."
                  rows={3}
                  className="cms-input"
                  style={{ width: '100%', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            3. KEAHLIAN & CV
        ───────────────────────────────────────────────────────────── */}
        {shouldRenderSection('skills_history') && (
          <div style={{
            background: 'var(--cms-card-bg, rgba(255,255,255,0.03))',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                  <GraduationCap size={16} />
                </div>
                <div>
                  <span style={{ fontSize: 13.5, fontWeight: 800 }}>Keahlian &amp; CV</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSaveProfile('Keahlian')}
                title="Simpan"
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--cms-accent, #D95629)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Save size={14} />
              </button>
            </div>

            {/* 3.1 Software */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Code2 size={13} color="var(--cms-accent)" />
                <span style={{ fontSize: 12, fontWeight: 800 }}>Software ({biodata.skills.length})</span>
              </div>

              {/* Presets */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {POPULAR_SKILL_PRESETS.map((p) => {
                  const already = biodata.skills.some(s => getSkillName(s).toLowerCase() === p.name.toLowerCase());
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => !already && handleAddSkill(p)}
                      disabled={already}
                      title={p.description}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 20,
                        border: '1px solid ' + (already ? 'rgba(16, 185, 129, 0.4)' : 'var(--glass-border)'),
                        background: already ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                        color: already ? '#10b981' : 'var(--cms-text-muted)',
                        fontSize: 10.5,
                        fontWeight: 700,
                        cursor: already ? 'default' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3
                      }}
                    >
                      {already ? <Check size={10} /> : <Plus size={10} />}
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Skills list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {biodata.skills.map((skill, index) => {
                  const sName = getSkillName(skill);
                  const sDesc = getSkillDesc(skill);
                  const sKey = getSkillId(skill, index);

                  return (
                    <div
                      key={sKey}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--cms-accent, #D95629)' }}>
                          {sName}
                        </span>
                        <div style={{ display: 'flex', gap: 2 }}>
                          <button
                            type="button"
                            onClick={() => handleMoveSkill(index, -1)}
                            disabled={index === 0}
                            title="Naik"
                            style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 2 }}
                          >
                            <ChevronUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveSkill(index, 1)}
                            disabled={index === biodata.skills.length - 1}
                            title="Turun"
                            style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 2 }}
                          >
                            <ChevronDown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(index)}
                            title="Hapus"
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={sDesc}
                        onChange={(e) => handleUpdateSkillDesc(index, e.target.value)}
                        placeholder="Keterangan..."
                        className="cms-input"
                        style={{ width: '100%', height: 30, borderRadius: 6, fontSize: 11.5, boxSizing: 'border-box' }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Add skill input */}
              <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                <input
                  type="text"
                  value={newSkillInput.name}
                  onChange={e => setNewSkillInput(p => ({ ...p, name: e.target.value }))}
                  placeholder="Software baru..."
                  className="cms-input"
                  style={{ flex: 1, height: 34, borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  title="Tambah"
                  style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: 'var(--cms-accent, #D95629)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* 3.2 Bahasa */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--glass-border)', paddingTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <LanguagesIcon size={13} color="#3b82f6" />
                <span style={{ fontSize: 12, fontWeight: 800 }}>Bahasa ({biodata.languages.length})</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {POPULAR_LANG_PRESETS.map((p) => {
                  const already = biodata.languages.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => !already && handleAddLanguage(p)}
                      disabled={already}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 20,
                        border: '1px solid ' + (already ? 'rgba(59, 130, 246, 0.4)' : 'var(--glass-border)'),
                        background: already ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)',
                        color: already ? '#60a5fa' : 'var(--cms-text-muted)',
                        fontSize: 10.5,
                        fontWeight: 700,
                        cursor: already ? 'default' : 'pointer'
                      }}
                    >
                      {already ? <Check size={10} /> : <Plus size={10} />} {p}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {biodata.languages.map((lang, idx) => (
                  <div key={idx} style={{ padding: '3px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11.5 }}>{lang}</span>
                    <button type="button" onClick={() => handleRemoveLanguage(idx)} title="Hapus" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={newLangInput}
                  onChange={e => setNewLangInput(e.target.value)}
                  placeholder="Bahasa baru..."
                  className="cms-input"
                  style={{ flex: 1, height: 34, borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => handleAddLanguage()}
                  title="Tambah"
                  style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: 'var(--cms-accent, #D95629)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* 3.3 Pendidikan */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--glass-border)', paddingTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 800 }}>Pendidikan ({biodata.education?.length || 0})</span>
                <button
                  type="button"
                  onClick={handleAddEducation}
                  title="Tambah"
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Plus size={13} />
                </button>
              </div>

              {(biodata.education || []).map((edu, idx) => (
                <div key={idx} style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>#{idx + 1}</span>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button type="button" onClick={() => handleMoveEducation(idx, -1)} disabled={idx === 0} title="Naik" style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 2 }}>
                        <ChevronUp size={12} />
                      </button>
                      <button type="button" onClick={() => handleMoveEducation(idx, 1)} disabled={idx === (biodata.education?.length || 0) - 1} title="Turun" style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 2 }}>
                        <ChevronDown size={12} />
                      </button>
                      <button type="button" onClick={() => handleRemoveEducation(idx)} title="Hapus" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={e => handleUpdateEducation(idx, 'institution', e.target.value)}
                      placeholder="Institusi..."
                      className="cms-input"
                      style={{ height: 32, borderRadius: 6, fontSize: 11.5 }}
                    />
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={e => handleUpdateEducation(idx, 'degree', e.target.value)}
                      placeholder="Gelar..."
                      className="cms-input"
                      style={{ height: 32, borderRadius: 6, fontSize: 11.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 3.4 Pengalaman Kerja */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--glass-border)', paddingTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 800 }}>Pengalaman ({biodata.experiences?.length || 0})</span>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  title="Tambah"
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Plus size={13} />
                </button>
              </div>

              {(biodata.experiences || []).map((exp, idx) => (
                <div key={idx} style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>#{idx + 1}</span>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button type="button" onClick={() => handleMoveExperience(idx, -1)} disabled={idx === 0} title="Naik" style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 2 }}>
                        <ChevronUp size={12} />
                      </button>
                      <button type="button" onClick={() => handleMoveExperience(idx, 1)} disabled={idx === (biodata.experiences?.length || 0) - 1} title="Turun" style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 2 }}>
                        <ChevronDown size={12} />
                      </button>
                      <button type="button" onClick={() => handleRemoveExperience(idx)} title="Hapus" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={e => handleUpdateExperience(idx, 'company', e.target.value)}
                      placeholder="Perusahaan..."
                      className="cms-input"
                      style={{ height: 32, borderRadius: 6, fontSize: 11.5 }}
                    />
                    <input
                      type="text"
                      value={exp.role}
                      onChange={e => handleUpdateExperience(idx, 'role', e.target.value)}
                      placeholder="Jabatan..."
                      className="cms-input"
                      style={{ height: 32, borderRadius: 6, fontSize: 11.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            4. REKENING & QRIS
        ───────────────────────────────────────────────────────────── */}
        {shouldRenderSection('banking') && (
          <div style={{
            background: 'var(--cms-card-bg, rgba(255,255,255,0.03))',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                  <CreditCard size={16} />
                </div>
                <div>
                  <span style={{ fontSize: 13.5, fontWeight: 800 }}>Rekening &amp; QRIS</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => handleAddBank('BCA')}
                  title="Tambah Rekening"
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveProfile('Rekening')}
                  title="Simpan"
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--cms-accent, #D95629)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Save size={14} />
                </button>
              </div>
            </div>

            {/* List Rekening */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(profile.bankAccounts || []).map((b, idx) => (
                <div key={b.id || idx} style={{
                  padding: 10,
                  borderRadius: 10,
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ padding: '2px 7px', borderRadius: 4, background: b.color || '#003399', color: '#fff', fontSize: 10, fontWeight: 800 }}>
                      {b.bankName}
                    </span>
                    <button type="button" onClick={() => handleRemoveBank(b.id)} title="Hapus" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, marginBottom: 3, color: 'var(--cms-text-muted)' }}>Bank</label>
                      <select
                        value={b.bankName}
                        onChange={e => {
                          const preset = BANK_PRESETS.find(p => p.name === e.target.value);
                          const updated = (profile.bankAccounts || []).map((bk, i) => i === idx ? {
                            ...bk,
                            bankName: e.target.value,
                            color: preset?.color || bk.color
                          } : bk);
                          setProfile(p => ({ ...p, bankAccounts: updated }));
                          setHasProfileChanges(true);
                        }}
                        className="cms-input"
                        style={{ width: '100%', height: 34, borderRadius: 6, fontSize: 12 }}
                      >
                        {BANK_PRESETS.map(bp => (
                          <option key={bp.name} value={bp.name}>{bp.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, marginBottom: 3, color: 'var(--cms-text-muted)' }}>Nomor Rekening</label>
                      <input
                        type="text"
                        value={b.accountNumber}
                        onChange={e => {
                          const updated = (profile.bankAccounts || []).map((bk, i) => i === idx ? { ...bk, accountNumber: e.target.value } : bk);
                          setProfile(p => ({ ...p, bankAccounts: updated }));
                          setHasProfileChanges(true);
                        }}
                        placeholder="1234567890"
                        className="cms-input"
                        style={{ width: '100%', height: 34, borderRadius: 6, fontSize: 12, fontWeight: 700 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, marginBottom: 3, color: 'var(--cms-text-muted)' }}>Atas Nama</label>
                      <input
                        type="text"
                        value={b.accountName}
                        onChange={e => {
                          const updated = (profile.bankAccounts || []).map((bk, i) => i === idx ? { ...bk, accountName: e.target.value } : bk);
                          setProfile(p => ({ ...p, bankAccounts: updated }));
                          setHasProfileChanges(true);
                        }}
                        placeholder="Nama pemilik"
                        className="cms-input"
                        style={{ width: '100%', height: 34, borderRadius: 6, fontSize: 12 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* QRIS */}
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <QrCode size={13} color="var(--cms-accent)" />
                <span style={{ fontSize: 11.5, fontWeight: 800 }}>QRIS</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 6 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, marginBottom: 3, color: 'var(--cms-text-muted)' }}>Merchant</label>
                  <input
                    type="text"
                    value={profile.qris?.merchantName || ''}
                    onChange={e => {
                      setProfile(p => ({
                        ...p,
                        qris: { ...(p.qris || { enabled: true, imageUrl: '' }), merchantName: e.target.value }
                      }));
                      setHasProfileChanges(true);
                    }}
                    placeholder="Nama merchant"
                    className="cms-input"
                    style={{ width: '100%', height: 34, borderRadius: 6, fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, marginBottom: 3, color: 'var(--cms-text-muted)' }}>Foto QRIS</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input
                      type="text"
                      value={profile.qris?.imageUrl || ''}
                      onChange={e => {
                        setProfile(p => ({
                          ...p,
                          qris: { ...(p.qris || { enabled: true, imageUrl: '' }), imageUrl: e.target.value }
                        }));
                        setHasProfileChanges(true);
                      }}
                      placeholder="URL foto QRIS..."
                      className="cms-input"
                      style={{ flex: 1, height: 34, borderRadius: 6, fontSize: 12 }}
                    />
                    <button
                      type="button"
                      onClick={() => { setGalleryTarget('qris'); setIsGalleryOpen(true); }}
                      title="Galeri Media"
                      style={{ width: 34, height: 34, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                    >
                      <ImageIcon size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            5. KONTAK
        ───────────────────────────────────────────────────────────── */}
        {shouldRenderSection('contact') && (
          <div style={{
            background: 'var(--cms-card-bg, rgba(255,255,255,0.03))',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <Phone size={16} />
                </div>
                <div>
                  <span style={{ fontSize: 13.5, fontWeight: 800 }}>Kontak</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSaveProfile('Kontak')}
                title="Simpan"
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--cms-accent, #D95629)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Save size={14} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>WhatsApp Utama</label>
                <input
                  type="text"
                  value={profile.whatsapp || ''}
                  onChange={e => { setProfile(p => ({ ...p, whatsapp: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="081234567890"
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, fontWeight: 700, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>WhatsApp Cadangan</label>
                <input
                  type="text"
                  value={profile.whatsappAlt || ''}
                  onChange={e => { setProfile(p => ({ ...p, whatsappAlt: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="Nomor alternatif"
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>Email</label>
                <input
                  type="email"
                  value={profile.email || ''}
                  onChange={e => { setProfile(p => ({ ...p, email: e.target.value })); setHasProfileChanges(true); }}
                  placeholder="hi@sumrday.com"
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 12.5, boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            6. MEDIA SOSIAL
        ───────────────────────────────────────────────────────────── */}
        {shouldRenderSection('socials') && (
          <div style={{
            background: 'var(--cms-card-bg, rgba(255,255,255,0.03))',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' }}>
                  <Globe size={16} />
                </div>
                <div>
                  <span style={{ fontSize: 13.5, fontWeight: 800 }}>Media Sosial</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSaveProfile('Media Sosial')}
                title="Simpan"
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--cms-accent, #D95629)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Save size={14} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8 }}>
              {SOCIAL_PLATFORMS.map(soc => (
                <div key={soc.id}>
                  <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, marginBottom: 3, color: 'var(--cms-text-muted)' }}>{soc.name}</label>
                  <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, fontSize: 11, color: 'var(--cms-text-muted)', pointerEvents: 'none' }}>
                      {soc.prefix}
                    </span>
                    <input
                      type="text"
                      value={(profile.socials as any)?.[soc.id] || ''}
                      onChange={e => {
                        const val = e.target.value.replace(/^@/, '');
                        setProfile(p => ({
                          ...p,
                          socials: { ...(p.socials || {}), [soc.id]: val }
                        }));
                        setHasProfileChanges(true);
                      }}
                      placeholder={soc.placeholder}
                      className="cms-input"
                      style={{ width: '100%', height: 34, borderRadius: 6, paddingLeft: 26, fontSize: 12, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            7. KARYA (PORTOFOLIO)
        ───────────────────────────────────────────────────────────── */}
        {shouldRenderSection('portfolio') && (
          <div style={{
            background: 'var(--cms-card-bg, rgba(255,255,255,0.03))',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}>
                  <Star size={16} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800 }}>Karya Portofolio ({portfolioList.length})</span>
                  {editingIds.portfolio && (
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', fontWeight: 800 }}>
                      Mode Edit
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {editingIds.portfolio && (
                  <button
                    type="button"
                    onClick={handleCancelEditPortfolio}
                    title="Batal Edit"
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddPortfolio}
                  title={editingIds.portfolio ? 'Simpan Perubahan' : 'Tambah Karya'}
                  style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: editingIds.portfolio ? '#10b981' : 'var(--cms-accent, #D95629)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {editingIds.portfolio ? <Check size={15} /> : <Plus size={15} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
              <input
                type="text"
                placeholder="Judul karya *"
                value={newPortfolio.title}
                onChange={e => setNewPortfolio(p => ({ ...p, title: e.target.value }))}
                className="cms-input"
                style={{ height: 36, borderRadius: 8, fontSize: 12.5 }}
              />
              <input
                type="text"
                placeholder="Kategori"
                value={newPortfolio.category}
                onChange={e => setNewPortfolio(p => ({ ...p, category: e.target.value }))}
                className="cms-input"
                style={{ height: 36, borderRadius: 8, fontSize: 12.5 }}
              />
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  type="text"
                  placeholder="URL Sampul"
                  value={newPortfolio.image}
                  onChange={e => setNewPortfolio(p => ({ ...p, image: e.target.value }))}
                  className="cms-input"
                  style={{ flex: 1, height: 36, borderRadius: 8, fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={() => { setGalleryTarget('portfolio'); setIsGalleryOpen(true); }}
                  title="Galeri Media"
                  style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <ImageIcon size={14} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Tautan demo"
                value={newPortfolio.link}
                onChange={e => setNewPortfolio(p => ({ ...p, link: e.target.value }))}
                className="cms-input"
                style={{ height: 36, borderRadius: 8, fontSize: 12.5 }}
              />
              <div style={{ gridColumn: '1 / -1' }}>
                <textarea
                  placeholder="Deskripsi karya..."
                  value={newPortfolio.description}
                  onChange={e => setNewPortfolio(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="cms-input"
                  style={{ width: '100%', borderRadius: 8, padding: '8px', fontSize: 12, boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
            </div>

            {renderCollectionItems(
              'portfolio',
              portfolioList,
              it => it.title || it.name || 'Karya',
              it => it.category || '',
              handleEditPortfolio,
              handleRemovePortfolio
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            8. PRODUK (KATALOG TOKO)
        ───────────────────────────────────────────────────────────── */}
        {shouldRenderSection('catalog') && (
          <div style={{
            background: 'var(--cms-card-bg, rgba(255,255,255,0.03))',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
                  <ShoppingBag size={16} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800 }}>Katalog Produk ({catalogList.length})</span>
                  {editingIds.catalog && (
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', fontWeight: 800 }}>
                      Mode Edit
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {editingIds.catalog && (
                  <button
                    type="button"
                    onClick={handleCancelEditProduct}
                    title="Batal Edit"
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddProduct}
                  title={editingIds.catalog ? 'Simpan Perubahan' : 'Tambah Produk'}
                  style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: editingIds.catalog ? '#10b981' : 'var(--cms-accent, #D95629)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {editingIds.catalog ? <Check size={15} /> : <Plus size={15} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
              <input
                type="text"
                placeholder="Nama produk *"
                value={newProduct.name}
                onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                className="cms-input"
                style={{ height: 36, borderRadius: 8, fontSize: 12.5 }}
              />
              <input
                type="text"
                placeholder="Harga (Rp) *"
                value={newProduct.price}
                onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))}
                className="cms-input"
                style={{ height: 36, borderRadius: 8, fontSize: 12.5 }}
              />
              <select
                value={newProduct.type}
                onChange={e => setNewProduct(p => ({ ...p, type: e.target.value }))}
                className="cms-input"
                style={{ height: 36, borderRadius: 8, fontSize: 12 }}
              >
                <option value="digital">Digital</option>
                <option value="fisik">Fisik</option>
                <option value="jasa">Jasa</option>
              </select>
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  type="text"
                  placeholder="URL Foto"
                  value={newProduct.image}
                  onChange={e => setNewProduct(p => ({ ...p, image: e.target.value }))}
                  className="cms-input"
                  style={{ flex: 1, height: 36, borderRadius: 8, fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={() => { setGalleryTarget('product'); setIsGalleryOpen(true); }}
                  title="Galeri Media"
                  style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <ImageIcon size={14} />
                </button>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <textarea
                  placeholder="Deskripsi produk..."
                  value={newProduct.description}
                  onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="cms-input"
                  style={{ width: '100%', borderRadius: 8, padding: '8px', fontSize: 12, boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
            </div>

            {renderCollectionItems(
              'catalog',
              catalogList,
              it => it.name || it.title || 'Produk',
              it => it.price ? `Rp ${Number(it.price).toLocaleString('id-ID')}` : '',
              handleEditProduct,
              handleRemoveProduct
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            9. ARTIKEL (BLOG)
        ───────────────────────────────────────────────────────────── */}
        {shouldRenderSection('blog') && (
          <div style={{
            background: 'var(--cms-card-bg, rgba(255,255,255,0.03))',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                  <BookOpen size={16} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800 }}>Artikel Blog ({blogList.length})</span>
                  {editingIds.blog && (
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', fontWeight: 800 }}>
                      Mode Edit
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {editingIds.blog && (
                  <button
                    type="button"
                    onClick={handleCancelEditBlog}
                    title="Batal Edit"
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddBlog}
                  title={editingIds.blog ? 'Simpan Perubahan' : 'Terbitkan Artikel'}
                  style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: editingIds.blog ? '#10b981' : 'var(--cms-accent, #D95629)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {editingIds.blog ? <Check size={15} /> : <Plus size={15} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
              <input
                type="text"
                placeholder="Judul artikel *"
                value={newBlog.title}
                onChange={e => setNewBlog(p => ({ ...p, title: e.target.value }))}
                className="cms-input"
                style={{ height: 36, borderRadius: 8, fontSize: 12.5 }}
              />
              <input
                type="text"
                placeholder="Kategori"
                value={newBlog.category}
                onChange={e => setNewBlog(p => ({ ...p, category: e.target.value }))}
                className="cms-input"
                style={{ height: 36, borderRadius: 8, fontSize: 12.5 }}
              />
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  type="text"
                  placeholder="URL Cover"
                  value={newBlog.coverImage}
                  onChange={e => setNewBlog(p => ({ ...p, coverImage: e.target.value }))}
                  className="cms-input"
                  style={{ flex: 1, height: 36, borderRadius: 8, fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={() => { setGalleryTarget('blog'); setIsGalleryOpen(true); }}
                  title="Galeri Media"
                  style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <ImageIcon size={14} />
                </button>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <textarea
                  placeholder="Ringkasan artikel..."
                  value={newBlog.excerpt}
                  onChange={e => setNewBlog(p => ({ ...p, excerpt: e.target.value, content: e.target.value }))}
                  rows={2}
                  className="cms-input"
                  style={{ width: '100%', borderRadius: 8, padding: '8px', fontSize: 12, boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
            </div>

            {renderCollectionItems(
              'blog',
              blogList,
              it => it.title || 'Artikel',
              it => it.category || '',
              handleEditBlog,
              handleRemoveBlog
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            10. TARIF (RATE CARD)
        ───────────────────────────────────────────────────────────── */}
        {shouldRenderSection('ratecard') && (
          <div style={{
            background: 'var(--cms-card-bg, rgba(255,255,255,0.03))',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(14, 165, 233, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
                  <Receipt size={16} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800 }}>Paket Tarif ({rateCardList.length})</span>
                  {editingIds.ratecard && (
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', fontWeight: 800 }}>
                      Mode Edit
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {editingIds.ratecard && (
                  <button
                    type="button"
                    onClick={handleCancelEditRateCard}
                    title="Batal Edit"
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddRateCard}
                  title={editingIds.ratecard ? 'Simpan Perubahan' : 'Tambah Paket'}
                  style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: editingIds.ratecard ? '#10b981' : 'var(--cms-accent, #D95629)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {editingIds.ratecard ? <Check size={15} /> : <Plus size={15} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
              <input
                type="text"
                placeholder="Nama paket *"
                value={newRateCard.title}
                onChange={e => setNewRateCard(p => ({ ...p, title: e.target.value }))}
                className="cms-input"
                style={{ height: 36, borderRadius: 8, fontSize: 12.5 }}
              />
              <input
                type="text"
                placeholder="Harga (Rp) *"
                value={newRateCard.price}
                onChange={e => setNewRateCard(p => ({ ...p, price: e.target.value }))}
                className="cms-input"
                style={{ height: 36, borderRadius: 8, fontSize: 12.5 }}
              />
              <input
                type="text"
                placeholder="Periode (per proyek)"
                value={newRateCard.billingPeriod}
                onChange={e => setNewRateCard(p => ({ ...p, billingPeriod: e.target.value }))}
                className="cms-input"
                style={{ height: 36, borderRadius: 8, fontSize: 12.5 }}
              />
              <div style={{ gridColumn: '1 / -1' }}>
                <textarea
                  placeholder="Deliverables (satu per baris)..."
                  value={newRateCard.deliverables}
                  onChange={e => setNewRateCard(p => ({ ...p, deliverables: e.target.value }))}
                  rows={2}
                  className="cms-input"
                  style={{ width: '100%', borderRadius: 8, padding: '8px', fontSize: 12, boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
            </div>

            {renderCollectionItems(
              'ratecard',
              rateCardList,
              it => it.title || it.name || 'Paket',
              it => it.price ? `Rp ${Number(it.price).toLocaleString('id-ID')}` : '',
              handleEditRateCard,
              handleRemoveRateCard
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            11. ULASAN (TESTIMONI)
        ───────────────────────────────────────────────────────────── */}
        {shouldRenderSection('reviews') && (
          <div style={{
            background: 'var(--cms-card-bg, rgba(255,255,255,0.03))',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(249, 115, 22, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' }}>
                  <Quote size={16} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800 }}>Ulasan Klien ({reviewList.length})</span>
                  {editingIds.reviews && (
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', fontWeight: 800 }}>
                      Mode Edit
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {editingIds.reviews && (
                  <button
                    type="button"
                    onClick={handleCancelEditReview}
                    title="Batal Edit"
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddReview}
                  title={editingIds.reviews ? 'Simpan Perubahan' : 'Tambah Ulasan'}
                  style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: editingIds.reviews ? '#10b981' : 'var(--cms-accent, #D95629)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {editingIds.reviews ? <Check size={15} /> : <Plus size={15} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
              <input
                type="text"
                placeholder="Nama klien *"
                value={newReview.clientName}
                onChange={e => setNewReview(p => ({ ...p, clientName: e.target.value }))}
                className="cms-input"
                style={{ height: 36, borderRadius: 8, fontSize: 12.5 }}
              />
              <input
                type="text"
                placeholder="Brand / Perusahaan klien"
                value={newReview.brand}
                onChange={e => setNewReview(p => ({ ...p, brand: e.target.value }))}
                className="cms-input"
                style={{ height: 36, borderRadius: 8, fontSize: 12.5 }}
              />
              <select
                value={newReview.rating}
                onChange={e => setNewReview(p => ({ ...p, rating: Number(e.target.value) }))}
                className="cms-input"
                style={{ height: 36, borderRadius: 8, fontSize: 12 }}
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5.0)</option>
                <option value={4}>⭐⭐⭐⭐ (4.0)</option>
                <option value={3}>⭐⭐⭐ (3.0)</option>
              </select>
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  type="text"
                  placeholder="URL Avatar Klien"
                  value={newReview.avatarUrl}
                  onChange={e => setNewReview(p => ({ ...p, avatarUrl: e.target.value }))}
                  className="cms-input"
                  style={{ flex: 1, height: 36, borderRadius: 8, fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={() => { setGalleryTarget('review_avatar'); setIsGalleryOpen(true); }}
                  title="Galeri Media"
                  style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <ImageIcon size={14} />
                </button>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <textarea
                  placeholder="Isi ulasan..."
                  value={newReview.reviewText}
                  onChange={e => setNewReview(p => ({ ...p, reviewText: e.target.value }))}
                  rows={2}
                  className="cms-input"
                  style={{ width: '100%', borderRadius: 8, padding: '8px', fontSize: 12, boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
            </div>

            {renderCollectionItems(
              'reviews',
              reviewList,
              it => it.clientName || it.author || 'Klien',
              it => it.brand || `${it.rating || 5}★`,
              handleEditReview,
              handleRemoveReview
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            12. FAQ (TANYA JAWAB)
        ───────────────────────────────────────────────────────────── */}
        {shouldRenderSection('faq') && (
          <div style={{
            background: 'var(--cms-card-bg, rgba(255,255,255,0.03))',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#14b8a6' }}>
                  <HelpCircle size={16} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800 }}>FAQ ({faqList.length})</span>
                  {editingIds.faq && (
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', fontWeight: 800 }}>
                      Mode Edit
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {editingIds.faq && (
                  <button
                    type="button"
                    onClick={handleCancelEditFaq}
                    title="Batal Edit"
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddFaq}
                  title={editingIds.faq ? 'Simpan Perubahan' : 'Tambah FAQ'}
                  style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: editingIds.faq ? '#10b981' : 'var(--cms-accent, #D95629)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {editingIds.faq ? <Check size={15} /> : <Plus size={15} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="text"
                placeholder="Pertanyaan *"
                value={newFaq.question}
                onChange={e => setNewFaq(p => ({ ...p, question: e.target.value }))}
                className="cms-input"
                style={{ height: 36, borderRadius: 8, fontSize: 12.5 }}
              />
              <textarea
                placeholder="Jawaban..."
                value={newFaq.answer}
                onChange={e => setNewFaq(p => ({ ...p, answer: e.target.value }))}
                rows={2}
                className="cms-input"
                style={{ width: '100%', borderRadius: 8, padding: '8px', fontSize: 12, boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            {renderCollectionItems(
              'faq',
              faqList,
              it => it.question || 'FAQ',
              null,
              handleEditFaq,
              handleRemoveFaq
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            13. TAUTAN (BIO LINKS)
        ───────────────────────────────────────────────────────────── */}
        {shouldRenderSection('links') && (
          <div style={{
            background: 'var(--cms-card-bg, rgba(255,255,255,0.03))',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                  <Link2 size={16} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800 }}>Tautan Bio ({linksList.length})</span>
                  {editingIds.links && (
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', fontWeight: 800 }}>
                      Mode Edit
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {editingIds.links && (
                  <button
                    type="button"
                    onClick={handleCancelEditLink}
                    title="Batal Edit"
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddLink}
                  title={editingIds.links ? 'Simpan Perubahan' : 'Tambah Tautan'}
                  style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: editingIds.links ? '#10b981' : 'var(--cms-accent, #D95629)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {editingIds.links ? <Check size={15} /> : <Plus size={15} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
              <input
                type="text"
                placeholder="Judul tautan *"
                value={newLink.title}
                onChange={e => setNewLink(p => ({ ...p, title: e.target.value }))}
                className="cms-input"
                style={{ height: 36, borderRadius: 8, fontSize: 12.5 }}
              />
              <input
                type="text"
                placeholder="URL tautan *"
                value={newLink.url}
                onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))}
                className="cms-input"
                style={{ height: 36, borderRadius: 8, fontSize: 12.5 }}
              />
            </div>

            {renderCollectionItems(
              'links',
              linksList,
              it => it.title || it.label || 'Tautan',
              it => it.url ? it.url.replace(/^https?:\/\//, '').slice(0, 24) : '',
              handleEditLink,
              handleRemoveLink
            )}
          </div>
        )}

      </div>

      {/* Media Gallery Modal */}
      {isGalleryOpen && (
        <MediaGalleryModal
          isOpen={isGalleryOpen}
          onClose={() => { setIsGalleryOpen(false); setGalleryTarget(null); }}
          onSelect={(url) => {
            if (galleryTarget === 'portfolio') {
              setNewPortfolio(p => ({ ...p, image: url }));
            } else if (galleryTarget === 'product') {
              setNewProduct(p => ({ ...p, image: url }));
            } else if (galleryTarget === 'blog') {
              setNewBlog(p => ({ ...p, coverImage: url }));
            } else if (galleryTarget === 'qris') {
              setProfile(p => ({
                ...p,
                qris: { ...(p.qris || { enabled: true, imageUrl: '' }), imageUrl: url }
              }));
              setHasProfileChanges(true);
            } else if (galleryTarget === 'avatar') {
              setBiodata(p => ({ ...p, avatarUrl: url }));
              setHasProfileChanges(true);
            } else if (galleryTarget === 'personal_cover') {
              setBiodata(p => ({ ...p, coverUrl: url }));
              setHasProfileChanges(true);
            } else if (galleryTarget === 'company_logo') {
              setCompanyExtra(p => ({ ...p, logoUrl: url }));
              setHasProfileChanges(true);
            } else if (galleryTarget === 'company_cover') {
              setCompanyExtra(p => ({ ...p, coverUrl: url }));
              setHasProfileChanges(true);
            } else if (galleryTarget === 'review_avatar') {
              setNewReview(p => ({ ...p, avatarUrl: url }));
            }
            setIsGalleryOpen(false);
            setGalleryTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default MasterFormHub;
