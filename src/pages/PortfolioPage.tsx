import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowUpRight, Search, Sparkles, FolderGit2 } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useLandingData } from '../components/landing/useLandingData';
import LPProjectModal from '../components/landing/LPProjectModal';
import LPNavbar from '../components/landing/LPNavbar';
import { useLandingBodyFix } from '../hooks/useLandingBodyFix';
import LPFooter from '../components/landing/LPFooter';
import SEOHelmet from '../components/SEOHelmet';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import PageHeroHeader from '../components/common/PageHeroHeader';

const PortfolioPage: React.FC = () => {
  const { data, projects, isLoading } = useLandingData();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id?: string }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Synchronize URL deep-link /portfolio/:id or /karya/:id with selected project
  useEffect(() => {
    if (!projects || projects.length === 0) return;
    
    // Check if path has an ID, e.g. /portfolio/123 or /karya/123
    const pathParts = location.pathname.split('/').filter(Boolean);
    let targetId = params.id;
    if (!targetId && pathParts.length >= 2 && (pathParts[0] === 'portfolio' || pathParts[0] === 'karya')) {
      targetId = pathParts[1];
    }

    if (targetId) {
      const decodedId = decodeURIComponent(targetId);
      const found = projects.find((p: any) => p.id === decodedId || (p.slug && p.slug === decodedId) || (p.name && p.name.toLowerCase().replace(/\s+/g, '-') === decodedId));
      if (found) {
        setSelectedProject(found);
      }
    }
  }, [location.pathname, params.id, projects]);

  useScrollReveal(containerRef, [projects, activeCategory, searchQuery]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Unified website theme hook
  const { isDark } = useWebsiteTheme(data?.theme?.defaultMode);

  const [accentColor, setAccentColor] = useState<string>(() => (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || data?.theme?.accentColor || '#64748b');

  useEffect(() => {
    if (data?.theme?.accentColor) {
      setAccentColor(data.theme.accentColor);
    }
  }, [data?.theme?.accentColor]);

  useEffect(() => {
    const handleAccent = (e: any) => {
      if (e?.detail?.color) setAccentColor(e.detail.color);
    };
    window.addEventListener('porto_accent_color_changed', handleAccent);
    return () => window.removeEventListener('porto_accent_color_changed', handleAccent);
  }, []);

  // Force body/html/root scrollable (overrides global CMS fixed-body CSS)
  useLandingBodyFix();

  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const getProjectCover = (p: any): string | null => {
    if (p.coverImage) return p.coverImage;
    if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
    if (Array.isArray(p.attachments)) {
      const img = p.attachments.find((a: any) => a?.type?.startsWith('image/'));
      if (img) return img.url;
    }
    if (p.mediaType === 'youtube' && p.youtubeUrl) {
      const m = p.youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
      if (m && m[1]) return `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;
    }
    return null;
  };

  const categories = useMemo(() => {
    const fromProjects = Array.isArray(projects) ? projects.map((p) => p.category).filter(Boolean) : [];
    const fromConfig = Array.isArray(data?.projectCategories) ? data.projectCategories : [];
    const set = Array.from(new Set([...fromConfig, ...fromProjects])).filter(Boolean);
    return ['Semua', ...set];
  }, [data?.projectCategories, projects]);

  const filteredProjects = useMemo(() => {
    const list = Array.isArray(projects) ? projects : [];
    const q = searchQuery.trim().toLowerCase();

    return list.filter((p: any) => {
      const matchCat = activeCategory === 'Semua' || (p.category || '').toLowerCase() === activeCategory.toLowerCase();
      if (!matchCat) return false;
      if (!q) return true;
      const matchTitle = (p.name || p.title || '').toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      const tagsStr = Array.isArray(p.tags) ? p.tags.join(' ') : (typeof p.tags === 'string' ? p.tags : '');
      const matchTag = tagsStr.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchTag;
    });
  }, [projects, activeCategory, searchQuery]);

  if (isLoading) return <div style={{ minHeight: '100vh', background: isDark ? '#08080f' : '#f8fafc' }} />;

  return (
    <>
      <SEOHelmet 
        title={`Portfolio - ${data.hero?.headline || 'Arif Design Studio'}`}
        description="Semua karya desain, identitas visual, branding dan studi kasus kreatif."
      />

      {/* Floating Top Navbar (Isolated from page content) */}
      <LPNavbar
        items={(data?.navbar?.items || []) as any}
        loginBtnLabel={data?.navbar?.loginBtnLabel || 'Login'}
        logoText={data?.navbar?.logoText}
        isDark={isDark}
        accentColor={accentColor}
      />

      <div 
        ref={containerRef}
        style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: isDark ? '#08080f' : '#ffffff',
          color: textColor,
          transition: 'background-color 0.3s cubic-bezier(0.16, 1, 0.3, 1), color 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
        <main style={{ flex: 1, padding: isMobile ? '90px 16px 50px' : '120px 24px 70px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        
        {/* Page Hero Header */}
        <PageHeroHeader
          badgeIcon={<Sparkles size={14} />}
          badgeText={data?.pagesHeader?.portfolio?.badge || 'Koleksi Proyek & Desain'}
          title={data?.pagesHeader?.portfolio?.title || 'Karya Pilihan & Studi Kasus'}
          highlightText={data?.pagesHeader?.portfolio?.highlight || 'Studi Kasus'}
          description={data?.pagesHeader?.portfolio?.description || 'Eksplorasi karya desain grafis, antarmuka visual, branding identitas, serta portofolio proyek unggulan.'}
          accentColor={accentColor}
          textColor={textColor}
          subTextColor={subTextColor}
          stats={[
            { icon: <FolderGit2 size={15} />, value: Array.isArray(projects) ? projects.length : 0, label: 'Total Proyek' },
            { icon: <Sparkles size={15} />, value: Math.max(1, categories.length - 1), label: 'Kategori' },
            { icon: <ArrowUpRight size={15} />, value: filteredProjects.length, label: 'Ditampilkan' }
          ]}
        >
          {/* Quick in-page search input */}
          <div style={{
            position: 'relative',
            maxWidth: 420,
            margin: '0 auto'
          }}>
            <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: subTextColor }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama karya, topik, atau tag..."
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                borderRadius: 100,
                border: `1.5px solid ${cardBorder}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                color: textColor,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = accentColor)}
              onBlur={(e) => (e.currentTarget.style.borderColor = cardBorder)}
            />
          </div>
        </PageHeroHeader>

        {/* Category Filter Chips & Counter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 36 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 100,
                    border: `1.5px solid ${isActive ? accentColor : cardBorder}`,
                    background: isActive ? accentColor : 'transparent',
                    color: isActive ? '#fff' : subTextColor,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = `${accentColor}50`;
                      e.currentTarget.style.color = textColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = cardBorder;
                      e.currentTarget.style.color = subTextColor;
                    }
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: subTextColor, fontWeight: 500 }}>
            Menampilkan <strong style={{ color: textColor }}>{filteredProjects.length}</strong> karya
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: cardBg,
            borderRadius: 24,
            border: `1px solid ${cardBorder}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}>
            <FolderGit2 size={36} style={{ color: accentColor, opacity: 0.4 }} />
            <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: textColor }}>
              Belum ada karya yang cocok
            </h3>
            <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 14, color: subTextColor, maxWidth: 360 }}>
              Tidak ditemukan proyek dengan kategori atau kata kunci "{searchQuery}". Coba pilih kategori "Semua" atau kata kunci lain.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: 28 }}>
             {filteredProjects.map((project: any, idx: number) => {
               const cover = getProjectCover(project);
               return (
                 <div 
                   key={project.id || idx}
                   data-reveal="true"
                   className={`reveal-delay-${(idx % 4) + 1}`}
                   onClick={() => {
                     setSelectedProject(project);
                     navigate(`/portfolio/${project.id}`);
                   }}
                   style={{
                     background: cardBg,
                     borderRadius: 24,
                     overflow: 'hidden',
                     border: `1px solid ${cardBorder}`,
                     cursor: 'pointer',
                     transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease',
                     display: 'flex',
                     flexDirection: 'column',
                     backdropFilter: 'blur(10px)',
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.transform = 'translateY(-6px)';
                     e.currentTarget.style.boxShadow = isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.06)';
                     e.currentTarget.style.borderColor = `${accentColor}40`;
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.transform = 'translateY(0)';
                     e.currentTarget.style.boxShadow = 'none';
                     e.currentTarget.style.borderColor = cardBorder;
                   }}
                 >
                   <div style={{ width: '100%', aspectRatio: '16/10', backgroundColor: isDark ? '#0f172a' : '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                     {cover ? (
                       <img
                         src={cover}
                         alt={project.name || project.title}
                         loading="lazy"
                         style={{
                           width: '100%',
                           height: '100%',
                           objectFit: 'cover',
                           transition: 'transform 0.5s ease',
                         }}
                         onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                         onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                       />
                     ) : (
                       <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subTextColor, fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
                         Tanpa Gambar
                       </div>
                     )}
                     {project.category && (
                       <span style={{
                         position: 'absolute',
                         top: 14,
                         left: 14,
                         padding: '4px 10px',
                         borderRadius: 8,
                         background: 'rgba(0,0,0,0.65)',
                         backdropFilter: 'blur(8px)',
                         color: '#ffffff',
                         fontSize: 11,
                         fontFamily: "'Outfit', sans-serif",
                         fontWeight: 700,
                         textTransform: 'uppercase',
                         letterSpacing: '0.04em',
                       }}>
                         {project.category}
                       </span>
                     )}
                   </div>

                   <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flex: 1, gap: 16 }}>
                      <div style={{ minWidth: 0 }}>
                         <h3 style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 20,
                            fontWeight: 800,
                            color: textColor,
                            margin: '0 0 6px',
                            letterSpacing: '-0.5px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                         }}>
                            {project.name || project.title || 'Untitled Project'}
                         </h3>
                         <div style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 13,
                            color: subTextColor,
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                         }}>
                            {project.description || 'Klik untuk melihat detail studi kasus.'}
                         </div>
                         <div style={{
                            marginTop: 14,
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            color: accentColor,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                         }}>
                            Lihat Studi Kasus <ArrowUpRight size={14} />
                         </div>
                      </div>
                      
                      <div style={{
                         width: 44, height: 44, borderRadius: '50%',
                         background: `${accentColor}18`,
                         color: accentColor,
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         flexShrink: 0,
                         transition: 'background 0.2s, color 0.2s',
                      }}>
                         <ArrowUpRight size={18} />
                      </div>
                   </div>
                 </div>
               );
             })}
          </div>
        )}
      </main>

      <LPFooter isDark={isDark} accentColor={accentColor} data={data.footer} />

      {/* Detail Modal */}
      {selectedProject && (
        <LPProjectModal
          project={selectedProject}
          allProjects={projects}
          onSelectProject={(proj) => {
            setSelectedProject(proj);
            navigate(`/portfolio/${proj.id}`);
          }}
          onClose={() => {
            setSelectedProject(null);
            navigate('/portfolio');
          }}
          isDark={isDark}
          accentColor={accentColor}
        />
      )}
    </div>
    </>
  );
};

export default PortfolioPage;
