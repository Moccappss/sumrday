import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Copy, Share2, Eye, ExternalLink, Sparkles, Filter, Layers } from 'lucide-react';
import LPProjectModal from './LPProjectModal';
import { useContextMenu } from '../admin/ContextMenuProvider';
import { haptic } from '../../utils/haptics';

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

  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.85)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  const isValidCategory = (cat: string): boolean => {
    if (!cat || typeof cat !== 'string') return false;
    const trimmed = cat.trim();
    if (trimmed.length < 2 || trimmed.length > 30) return false;
    if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(trimmed)) return false;
    return true;
  };

  // Extract all unique categories dynamically from the projects dataset
  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.category && isValidCategory(p.category)) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set);
  }, [projects]);

  // Filter projects by category or featured label
  const displayedProjects = useMemo(() => {
    let list = projects;
    if (landingFeaturedLabel && selectedCategory === 'all') {
      const featured = projects.filter((p) => p.featuredLabel === landingFeaturedLabel);
      if (featured.length > 0) list = featured;
    }
    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase());
    }
    return list.slice(0, 8);
  }, [projects, landingFeaturedLabel, selectedCategory]);

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
    return null;
  };

  const getProjectContextMenu = (project: ProjectData) => {
    const projectUrl = `${window.location.origin}/portfolio`;
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
          action: () => navigate('/portfolio')
        }
      ]
    };
  };

  return (
    <section
      id="portfolio"
      style={{
        padding: '110px 24px',
        background: isDark ? '#08080f' : '#ffffff',
        position: 'relative',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        
        {/* Section Header */}
        <div 
          data-reveal="true"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 36,
            flexWrap: 'wrap',
            gap: 20,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ 
              fontFamily: "'Inter', sans-serif", 
              fontSize: 12, 
              fontWeight: 700, 
              letterSpacing: '0.14em', 
              color: accentColor, 
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Layers size={14} />
              <span>{localization?.portfolioSectionTitle || 'KARYA PILIHAN'}</span>
            </div>
            <h2 style={{ 
              margin: 0, 
              fontFamily: "'Outfit', sans-serif", 
              fontSize: 'clamp(32px, 3.8vw, 48px)', 
              fontWeight: 850, 
              color: textColor, 
              letterSpacing: '-0.025em', 
              lineHeight: 1.15,
            }}>
              {localization?.portfolioMainTitle || 'Studi Kasus & Proyek Unggulan'}
            </h2>
          </div>

          <button
            onClick={() => navigate('/portfolio')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              border: `1.5px solid ${cardBorder}`,
              color: textColor,
              padding: '12px 22px',
              borderRadius: 100,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
              e.currentTarget.style.borderColor = accentColor;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
              e.currentTarget.style.borderColor = cardBorder;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>Lihat Semua ({projects.length})</span>
            <ArrowUpRight size={16} />
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
                padding: '8px 18px',
                borderRadius: 100,
                border: selectedCategory === 'all' ? `1.5px solid ${accentColor}` : `1px solid ${cardBorder}`,
                background: selectedCategory === 'all' ? accentColor : cardBg,
                color: selectedCategory === 'all' ? '#ffffff' : subTextColor,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
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
                    padding: '8px 18px',
                    borderRadius: 100,
                    border: active ? `1.5px solid ${accentColor}` : `1px solid ${cardBorder}`,
                    background: active ? accentColor : cardBg,
                    color: active ? '#ffffff' : subTextColor,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
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
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))',
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
                border: `1px solid ${cardBorder}`,
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
                  data-reveal="true"
                  className={`reveal-delay-${(idx % 6) + 1}`}
                  {...bindContextMenu(() => getProjectContextMenu(project))}
                  onClick={() => {
                    haptic.light();
                    setSelectedProject(project);
                  }}
                  style={{
                    background: cardBg,
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 24,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease',
                    boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.3)' : '0 10px 28px rgba(0,0,0,0.04)',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${accentColor}50`;
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = isDark 
                      ? `0 20px 48px -10px ${accentColor}30, 0 0 0 1px ${accentColor}30` 
                      : `0 20px 48px -10px ${accentColor}20, 0 0 0 1px ${accentColor}20`;
                    const img = e.currentTarget.querySelector('img') as HTMLImageElement;
                    if (img) img.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = cardBorder;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isDark ? '0 12px 32px rgba(0,0,0,0.3)' : '0 10px 28px rgba(0,0,0,0.04)';
                    const img = e.currentTarget.querySelector('img') as HTMLImageElement;
                    if (img) img.style.transform = 'scale(1)';
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '16/10',
                      background: isDark ? '#0f172a' : '#f1f5f9',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {cover ? (
                      <img
                        src={cover}
                        alt={project.name || project.title}
                        loading="lazy"
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

                    {/* Featured Badge */}
                    {project.featuredLabel && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 14,
                          left: 14,
                          padding: '4px 10px',
                          borderRadius: 100,
                          background: 'rgba(0, 0, 0, 0.65)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          color: '#ffffff',
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 11,
                          fontWeight: 700,
                          border: '1px solid rgba(255,255,255,0.15)',
                        }}
                      >
                        {project.featuredLabel}
                      </div>
                    )}
                  </div>

                  {/* Content Info */}
                  <div
                    style={{
                      padding: '20px 22px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 12,
                          fontWeight: 600,
                          color: accentColor,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          marginBottom: 4,
                        }}
                      >
                        {project.category || 'Karya Desain'}
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
    </section>
  );
};

export default LPPortfolio;
