import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Copy, Share2, Eye, ExternalLink, Sparkles, Filter, Layers, Image as ImageIcon, Building2, Box, BookOpen } from 'lucide-react';
import LPProjectModal from './LPProjectModal';
import ProjectReactions from './ProjectReactions';
import { useContextMenu } from '../admin/ContextMenuProvider';
import { haptic } from '../../utils/haptics';
import { getOptimizedCloudinaryUrl, getCloudinaryPdfPageUrl } from '../../utils/cloudinary';

interface ProjectData {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  coverImage?: string;
  images?: string[];
  attachments?: { url: string; name: string; type: string }[];
  tags?: string[];
  featuredLabel?: string;
  client?: string;
  year?: string | number;
  mediaType?: string;
  youtubeUrl?: string;
  model3dUrl?: string;
  pdfUrl?: string;
  pdfTotalPages?: number;
}

interface LPPortfolioProps {
  projects: ProjectData[];
  landingFeaturedLabel: string;
  isDark: boolean;
  accentColor: string;
  localization?: any;
}

const LPPortfolio: React.FC<LPPortfolioProps> = ({ projects = [], landingFeaturedLabel, isDark, accentColor, localization }) => {
  const navigate = useNavigate();
  const { bindContextMenu } = useContextMenu();
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const textColor = isDark ? '#ffffff' : '#0f1115';
  const subTextColor = isDark ? '#94a3b8' : '#5b6170';
  const cardBg = isDark ? '#151824' : '#ffffff';
  const surface2 = isDark ? '#1f2436' : '#f1f5f9';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const inkBtnBg = isDark ? '#ffffff' : '#0f1115';
  const inkBtnText = isDark ? '#0f1115' : '#ffffff';

  const isValidCategory = (cat: string): boolean => {
    if (!cat || typeof cat !== 'string') return false;
    const trimmed = cat.trim();
    if (trimmed.length < 2 || trimmed.length > 30) return false;
    if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(trimmed)) return false;
    return true;
  };

  const DEFAULT_PORTFOLIO_PROJECTS: ProjectData[] = useMemo(() => [
    {
      id: 'proj-def-flipbook-1',
      title: 'sumr.day Studio Lookbook & Brand Guide 2026',
      category: 'Editorial & Brand Book',
      description: 'Buku panduan identitas visual dan arsip eksplorasi desain studio sumr.day. Disajikan dalam format flipbook digital interaktif layaknya membaca majalah fisik.',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
      year: '2026',
      client: 'sumr.day Studio',
      featuredLabel: 'Flipbook Interaktif',
      mediaType: 'flipbook',
      pdfUrl: '',
      pdfTotalPages: 8,
      tags: ['Brand Guidelines', 'Editorial', 'Flipbook', 'Lookbook']
    },
    {
      id: 'proj-def-3d-1',
      title: 'Modern Architectural Armchair 3D',
      category: '3D & Spasial',
      description: 'Konsep visualisasi furnitur geometris modern (hasil export SketchUp/Blender) dengan tekstur fotorealistis dan inspeksi orbit 360°.',
      coverImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
      year: '2026',
      client: 'Atelier Studio',
      featuredLabel: 'Interaktif 3D',
      mediaType: '3d',
      model3dUrl: '/models/armchair.glb',
      tags: ['3D Modeling', 'SketchUp', 'Arsitektur', 'Render 3D']
    },
    {
      id: 'proj-def-3d-2',
      title: 'Cosmic Spatial Character & Asset',
      category: 'Visual 3D',
      description: 'Eksplorasi aset 3D sinematik bertekstur PBR tinggi untuk pengalaman portofolio interaktif dan augmented reality (AR).',
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
      year: '2026',
      client: 'Galactic Labs',
      featuredLabel: 'Eksplorasi 360°',
      mediaType: '3d',
      model3dUrl: '/models/helmet.glb',
      tags: ['3D Asset', 'PBR Material', 'Blender', 'AR Ready']
    },
    {
      id: 'proj-def-1',
      title: 'Kopi Nusantara Digital Flagship & Story Space',
      category: 'Interactive Web',
      description: 'Eksplorasi web interaktif berbasis Warm Tech untuk brand F&B ternama dengan katalog dinamis dan order WhatsApp.',
      coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
      year: '2026',
      client: 'Kopi Nusantara',
      featuredLabel: 'Karya Pilihan',
      tags: ['Interactive Web', 'Branding', 'PWA']
    },
    {
      id: 'proj-def-2',
      title: 'Lumina Studio Brand Identity & Spatial UI',
      category: 'UI/UX Design',
      description: 'Design system terkalibrasi tinggi, library komponen Figma, dan panduan tipografi skena modern.',
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
      year: '2025',
      client: 'Lumina Space',
      featuredLabel: 'Karya Unggulan',
      tags: ['Design System', 'UI/UX']
    },
    {
      id: 'proj-def-3',
      title: 'Skena Collective E-Commerce & Flash Drop',
      category: 'Web Platform',
      description: 'Platform etalase rilis kilat (flash drop) dengan countdown otomatis dan keranjang instan tanpa login.',
      coverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
      year: '2025',
      client: 'Skena Collective',
      featuredLabel: 'Paling Diminati',
      tags: ['E-Commerce', 'Creative Tech']
    },
    {
      id: 'proj-def-4',
      title: 'Nusantara Logistics Enterprise Portal',
      category: 'Interactive Web',
      description: 'Antarmuka pelacakan pengiriman kargo terpadu dengan micro-interactions dan visualisasi data realtime.',
      coverImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
      year: '2025',
      client: 'Nusantara Logistics',
      featuredLabel: 'Karya Pilihan',
      tags: ['Dashboard', 'Web App']
    }
  ], []);

  const activeProjects = useMemo(() => {
    if (Array.isArray(projects) && projects.length > 0) return projects;
    return DEFAULT_PORTFOLIO_PROJECTS;
  }, [projects, DEFAULT_PORTFOLIO_PROJECTS]);

  // Extract all unique categories dynamically from the projects dataset
  const categories = useMemo(() => {
    const set = new Set<string>();
    activeProjects.forEach((p) => {
      if (p.category && isValidCategory(p.category)) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set);
  }, [activeProjects]);

  // Filter projects by category or featured label
  const displayedProjects = useMemo(() => {
    let list = activeProjects;
    if (landingFeaturedLabel && selectedCategory === 'all') {
      const featured = activeProjects.filter((p) => p.featuredLabel === landingFeaturedLabel);
      if (featured.length > 0) list = featured;
    }
    if (selectedCategory !== 'all') {
      const selNorm = selectedCategory.trim().toLowerCase();
      list = list.filter((p) => {
        const catNorm = (p.category || '').trim().toLowerCase();
        if (catNorm === selNorm) return true;
        if (p.tags) {
          const tagList = Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' ? p.tags.split(',') : []);
          return tagList.some((t: string) => typeof t === 'string' && t.trim().toLowerCase() === selNorm);
        }
        return false;
      });
    }
    return list.slice(0, 8);
  }, [activeProjects, landingFeaturedLabel, selectedCategory]);

  const getAllProjectMedia = (p: ProjectData): string[] => {
    const list: string[] = [];
    if (p.coverImage && typeof p.coverImage === 'string') list.push(p.coverImage);
    if (Array.isArray(p.images)) {
      p.images.forEach((img: any) => {
        if (typeof img === 'string' && img && !list.includes(img)) list.push(img);
      });
    }
    if (Array.isArray(p.attachments)) {
      p.attachments.forEach((att: any) => {
        if (att && att.url && typeof att.url === 'string' && (!att.type || att.type.startsWith('image/')) && !list.includes(att.url)) {
          list.push(att.url);
        }
      });
    }
    if (list.length === 0 && p.mediaType === 'youtube' && p.youtubeUrl) {
      const m = p.youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
      if (m && m[1]) list.push(`https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`);
    }
    return list;
  };

  const getProjectCover = (p: ProjectData): string | null => {
    if (p.coverImage) return p.coverImage;
    if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
    if (Array.isArray(p.attachments)) {
      const img = p.attachments.find((a) => a?.type?.startsWith('image/'));
      if (img) return img.url;
    }
    if (p.mediaType === 'youtube' && p.youtubeUrl) {
      const m = p.youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
      if (m && m[1]) return `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;
    }
    if ((p.mediaType === 'flipbook' || p.pdfUrl) && p.pdfUrl) {
      const pdfPage = getCloudinaryPdfPageUrl(p.pdfUrl, 1, 800);
      if (pdfPage) return pdfPage;
    }
    return null;
  };

  const getProjectContextMenu = (project: ProjectData) => {
    const projectUrl = `${window.location.origin}/portofolio`;
    return {
      title: project.title || project.name || 'Detail Karya',
      subtitle: `${project.category || 'Kategori'} • ${project.year || 'Portofolio'}`,
      headerBadge: project.featuredLabel || 'Karya Unggulan',
      items: [
        {
          label: 'Lihat Studi Kasus Proyek',
          icon: <Eye size={15} color={accentColor} />,
          action: () => setSelectedProject(project)
        },
        {
          label: 'Salin Tautan Portofolio',
          icon: <Copy size={15} color="#10b981" />,
          action: () => {
            if (navigator.clipboard) navigator.clipboard.writeText(projectUrl);
          }
        },
        {
          label: 'Bagikan via WhatsApp',
          icon: <Share2 size={15} color="#25D366" />,
          action: () => {
            const text = encodeURIComponent(`Lihat karya keren "${project.title || project.name}" di sini:\n${projectUrl}`);
            window.open(`https://wa.me/?text=${text}`, '_blank');
          }
        },
        { separator: true, label: '' },
        {
          label: 'Buka Halaman Portofolio',
          icon: <ExternalLink size={15} color="#3b82f6" />,
          action: () => navigate('/portofolio')
        }
      ]
    };
  };

  return (
    <section
      id="portfolio"
      className="lp-portfolio-section"
      style={{
        padding: 'clamp(56px, 7vw, 84px) clamp(16px, 3.5vw, 24px)',
        background: isDark ? '#06070a' : '#eef2f6',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ maxWidth: 1240, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* Section Header */}
        <div 
          data-reveal="true"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 32,
            flexWrap: 'wrap',
            gap: 20,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ 
              fontFamily: "'Inter', sans-serif", 
              fontSize: 12, 
              fontWeight: 700, 
              color: textColor, 
              background: cardBg,
              padding: '6px 14px',
              borderRadius: 999,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: accentColor, flexShrink: 0 }} />
              <Layers size={13} color={accentColor} />
              <span>{localization?.portfolioSectionTitle || 'KARYA SERU'}</span>
            </div>
            <h2 style={{ 
              margin: 0, 
              fontFamily: "'Outfit', sans-serif", 
              fontSize: 'clamp(1.9rem, 4vw, 3rem)', 
              fontWeight: 800, 
              color: textColor, 
              letterSpacing: '-0.035em', 
              lineHeight: 1.08,
            }}>
              {localization?.portfolioMainTitle || 'Karya Pilihan'}
            </h2>
          </div>

          <button
            onClick={() => navigate('/portofolio')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              background: inkBtnBg,
              border: 'none',
              color: inkBtnText,
              padding: '6px 6px 6px 20px',
              height: 44,
              borderRadius: 999,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'transform .2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>Lihat Semua</span>
            <span style={{ width: 32, height: 32, borderRadius: 999, background: accentColor, color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ArrowUpRight size={16} />
            </span>
          </button>
        </div>

        {/* Dynamic Category Chips */}
        {categories.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 16,
              marginBottom: 32,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <button
              onClick={() => {
                haptic.selection();
                setSelectedCategory('all');
              }}
              style={{
                padding: '9px 18px',
                borderRadius: 999,
                border: 'none',
                background: selectedCategory === 'all' ? accentColor : cardBg,
                color: selectedCategory === 'all' ? '#ffffff' : textColor,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'transform .2s ease, background-color .2s ease',
              }}
            >
              Semua ({projects.length})
            </button>
            {categories.map((cat) => {
              const count = projects.filter((p) => p.category?.toLowerCase() === cat.toLowerCase()).length;
              const active = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => {
                    haptic.selection();
                    setSelectedCategory(cat);
                  }}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 999,
                    border: 'none',
                    background: active ? accentColor : cardBg,
                    color: active ? '#ffffff' : textColor,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'transform .2s ease, background-color .2s ease',
                  }}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Portfolio Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
            gap: 24,
          }}
        >
          {displayedProjects.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '70px 20px',
                background: cardBg,
                borderRadius: 24,
                border: 'none',
                color: subTextColor,
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
              }}
            >
              Belum ada karya yang ditemukan untuk kategori ini.
            </div>
          ) : (
            displayedProjects.map((project, idx) => {
              const cover = getProjectCover(project);
              return (
                <div
                  key={project.id || idx}
                  className={`lp-portfolio-card reveal-delay-${(idx % 6) + 1}`}
                  {...bindContextMenu(() => getProjectContextMenu(project))}
                  onClick={() => {
                    haptic.light();
                    setSelectedProject(project);
                  }}
                  style={{
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 22,
                    padding: 12,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'border-color 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: 'none',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(15, 23, 42, 0.22)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = cardBorder;
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '16/10',
                      background: surface2,
                      borderRadius: 16,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {cover ? (
                      <img
                        src={getOptimizedCloudinaryUrl(cover, { width: 800, quality: 'auto:good' })}
                        alt={project.name || project.title}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: subTextColor,
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        Pratinjau Proyek
                      </div>
                    )}

                    {/* Badges Container */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 14,
                        left: 14,
                        right: 14,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      {/* Featured Badge */}
                      {project.featuredLabel ? (
                        <div
                          style={{
                            padding: '4px 10px',
                            borderRadius: 100,
                            background: '#111827',
                            color: '#ffffff',
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 11,
                            fontWeight: 750,
                            border: '1px solid rgba(255,255,255,0.2)',
                          }}
                        >
                          {project.featuredLabel}
                        </div>
                      ) : <div />}

                      {/* Media Count Badge */}
                      {(() => {
                        const mediaList = getAllProjectMedia(project);
                        const hasVideo = project.mediaType === 'youtube' || Boolean(project.youtubeUrl);
                        const is3D = project.mediaType === '3d' || Boolean(project.model3dUrl);
                        const isFlipbook = project.mediaType === 'flipbook' || Boolean(project.pdfUrl);
                        if (mediaList.length <= 1 && !hasVideo && !is3D && !isFlipbook) return null;

                        return (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {isFlipbook && (
                              <span style={{
                                padding: '4px 9px',
                                borderRadius: 100,
                                background: '#0284c7',
                                color: '#ffffff',
                                fontSize: 10,
                                fontFamily: "'Outfit', sans-serif",
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}>
                                <BookOpen size={11} /> Flipbook
                              </span>
                            )}
                            {is3D && (
                              <span style={{
                                padding: '4px 9px',
                                borderRadius: 100,
                                background: '#d97706',
                                color: '#ffffff',
                                fontSize: 10,
                                fontFamily: "'Outfit', sans-serif",
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}>
                                <Box size={11} /> 3D
                              </span>
                            )}
                            {hasVideo && (
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: 100,
                                background: '#dc2626',
                                color: '#ffffff',
                                fontSize: 10,
                                fontFamily: "'Outfit', sans-serif",
                                fontWeight: 700,
                              }}>
                                Video
                              </span>
                            )}
                            {mediaList.length > 1 && (
                              <div
                                style={{
                                  padding: '4px 9px',
                                  borderRadius: 100,
                                  background: '#111827',
                                  color: '#ffffff',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  border: '1px solid rgba(255,255,255,0.2)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <ImageIcon size={12} />
                                <span>{mediaList.length}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Content Info */}
                  <div
                    style={{
                      padding: '20px 22px 14px 22px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 4,
                            flexWrap: 'wrap',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: accentColor,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {project.category || 'Karya Desain'}
                          </span>
                          {project.client && (
                            <span style={{ fontSize: 11.5, color: subTextColor, fontWeight: 500 }}>
                              • {project.client}
                            </span>
                          )}
                          {project.year && (
                            <span style={{ fontSize: 11.5, color: subTextColor, fontWeight: 500 }}>
                              ({project.year})
                            </span>
                          )}
                        </div>
                        <h3
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 19,
                            fontWeight: 800,
                            color: textColor,
                            margin: 0,
                            letterSpacing: '-0.02em',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {project.name || project.title || 'Tanpa Judul'}
                        </h3>
                        {project.description && (
                          <p
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: 13,
                              color: subTextColor,
                              margin: '6px 0 0',
                              lineHeight: 1.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {project.description}
                          </p>
                        )}
                        {Array.isArray(project.tags) && project.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                            {project.tags.slice(0, 3).map((t: string, tIdx: number) => (
                              <span
                                key={tIdx}
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 650,
                                  fontFamily: "'Outfit', sans-serif",
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  background: surface2,
                                  color: subTextColor,
                                }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                          color: textColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      >
                        <ArrowUpRight size={18} />
                      </div>
                    </div>

                    {/* Interactive Reactions Bar */}
                    <div
                      style={{
                        paddingTop: 10,
                        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <ProjectReactions
                        projectId={project.id || `proj-${idx}`}
                        isDark={isDark}
                        accentColor={accentColor}
                        compact={true}
                      />
                      <span
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 11,
                          fontWeight: 700,
                          color: subTextColor,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        Buka Karya <ArrowUpRight size={13} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <LPProjectModal
          project={selectedProject}
          allProjects={projects}
          onSelectProject={(proj) => setSelectedProject(proj)}
          onClose={() => setSelectedProject(null)}
          isDark={isDark}
          accentColor={accentColor}
        />
      )}

      <style>{`
        @media (max-width: 640px) {
          .lp-portfolio-section {
            padding: 64px 16px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default LPPortfolio;
