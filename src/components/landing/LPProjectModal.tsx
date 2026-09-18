import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, ChevronLeft, ChevronRight, ExternalLink, Calendar, Building, 
  Tag, Maximize2, Minimize2, ArrowUpRight, Sparkles 
} from 'lucide-react';
import SoftwareBadge from '../common/SoftwareBadge';
import { useNativeBackHandler } from '../../utils/nativeNavigation';
import { safeHtml } from '../../utils/security';

export interface ProjectData {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  coverImage?: string;
  images?: string[];
  attachments?: { url: string; name: string; type: string }[];
  tags?: string[];
  tools?: string[];
  software?: string[];
  client?: string;
  year?: string | number;
  mediaType?: 'image' | 'video' | 'youtube';
  youtubeUrl?: string;
  videoUrl?: string;
  videoOrientation?: 'landscape' | 'portrait';
}

interface LPProjectModalProps {
  project: ProjectData;
  onClose: () => void;
  onSelectProject?: (project: ProjectData) => void;
  allProjects?: ProjectData[];
  isDark: boolean;
  accentColor: string;
}

const LPProjectModal: React.FC<LPProjectModalProps> = ({ 
  project, 
  onClose, 
  onSelectProject,
  allProjects = [],
  isDark, 
  accentColor 
}) => {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Native 1-step back navigation
  useNativeBackHandler(Boolean(project) && !isFullScreen, onClose, 'lp_project_modal', 10);
  useNativeBackHandler(Boolean(project) && isFullScreen, () => setIsFullScreen(false), 'lp_project_fullscreen', 15);

  useEffect(() => {
    setCurrentImageIdx(0);
  }, [project?.id]);

  useEffect(() => {
    const scrollContainer = document.querySelector('.page-scroll') as HTMLElement;
    const originalOverflow = scrollContainer ? scrollContainer.style.overflowY : document.body.style.overflow;
    
    if (scrollContainer) {
      scrollContainer.style.overflowY = 'hidden';
    } else {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      if (scrollContainer) {
        scrollContainer.style.overflowY = originalOverflow;
      } else {
        document.body.style.overflow = originalOverflow;
      }
    };
  }, []);

  const allImages = useMemo(() => {
    const imgs: string[] = [];
    if (project.coverImage) imgs.push(project.coverImage);
    if (Array.isArray(project.images)) {
      project.images.forEach((img) => { if (img && !imgs.includes(img)) imgs.push(img); });
    }
    if (Array.isArray(project.attachments)) {
      project.attachments.forEach((att) => {
        if (att?.url && att?.type?.startsWith('image/') && !imgs.includes(att.url)) {
          imgs.push(att.url);
        }
      });
    }
    return imgs;
  }, [project]);

  const youtubeEmbedUrl = useMemo(() => {
    if (project.mediaType !== 'youtube' || !project.youtubeUrl) return '';
    const raw = (project.youtubeUrl || '').trim();
    try {
      const match = raw.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1`;
      }
      if (raw.length === 11) {
        return `https://www.youtube.com/embed/${raw}?autoplay=1&rel=0&modestbranding=1`;
      }
      const u = new URL(raw);
      if (u.hostname.includes('youtube.com')) {
        if (u.pathname.startsWith('/shorts/')) {
          const v = u.pathname.split('/shorts/')[1]?.split('?')[0];
          if (v) return `https://www.youtube.com/embed/${v}?autoplay=1&rel=0&modestbranding=1`;
        } else {
          const v = u.searchParams.get('v');
          if (v) return `https://www.youtube.com/embed/${v}?autoplay=1&rel=0&modestbranding=1`;
        }
      } else if (u.hostname.includes('youtu.be')) {
        const v = u.pathname.replace(/^\/+/, '').split('?')[0];
        if (v) return `https://www.youtube.com/embed/${v}?autoplay=1&rel=0&modestbranding=1`;
      }
    } catch {
      if (raw.length === 11) return `https://www.youtube.com/embed/${raw}?autoplay=1&rel=0&modestbranding=1`;
      const srcMatch = raw.match(/src="([^"]+)"/);
      if (srcMatch) return srcMatch[1];
    }
    return '';
  }, [project]);

  const isPortraitVideo = (project.videoOrientation === 'portrait' || (project.mediaType === 'youtube' && (project.youtubeUrl || '').includes('/shorts/'))) && (project.mediaType === 'video' || project.mediaType === 'youtube');
  const toolsList = (project.tools || project.software || []) as string[];

  const title = project.name || project.title || 'Proyek Tanpa Judul';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const bgColor = isDark ? '#0c0d14' : '#ffffff';
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const headerBg = isDark ? 'rgba(18, 19, 29, 0.95)' : 'rgba(255, 255, 255, 0.95)';

  // Suggested projects
  const suggestedProjects = useMemo(() => {
    if (!Array.isArray(allProjects) || allProjects.length <= 1) return [];
    return allProjects
      .filter(p => p.id !== project.id)
      .slice(0, 4);
  }, [allProjects, project.id]);

  const getCoverForProject = (p: ProjectData): string | null => {
    if (p.coverImage) return p.coverImage;
    if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
    if (Array.isArray(p.attachments)) {
      const img = p.attachments.find((a) => a?.type?.startsWith('image/'));
      if (img) return img.url;
    }
    return null;
  };

  // Reusable Media Component
  const renderMedia = (isPortrait: boolean) => {
    if (project.mediaType === 'youtube' && youtubeEmbedUrl) {
      if (isPortrait) {
        return (
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            padding: isFullScreen ? '24px 20px' : '16px 14px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              aspectRatio: '9/16',
              maxHeight: '100%',
              maxWidth: isFullScreen ? 460 : 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 22,
              overflow: 'hidden',
              boxShadow: '0 16px 44px rgba(0,0,0,0.4)',
              background: 'transparent'
            }}>
              <iframe
                src={youtubeEmbedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  border: 'none', 
                  display: 'block',
                  borderRadius: 22
                }}
              />
            </div>
          </div>
        );
      } else {
        return (
          <div style={{
            position: 'relative',
            width: '100%',
            padding: isFullScreen ? '24px 0 12px' : '16px 0 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '100%',
              maxWidth: 1040,
              margin: '0 auto',
              aspectRatio: '16/9',
              borderRadius: 22,
              overflow: 'hidden',
              boxShadow: '0 16px 44px rgba(0,0,0,0.3)',
              background: 'transparent'
            }}>
              <iframe
                src={youtubeEmbedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  border: 'none', 
                  display: 'block',
                  borderRadius: 22
                }}
              />
            </div>
          </div>
        );
      }
    }

    if (project.mediaType === 'video' && project.videoUrl) {
      if (isPortrait) {
        return (
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            padding: isFullScreen ? '24px 20px' : '16px 14px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              maxHeight: '100%',
              maxWidth: isFullScreen ? 460 : 400,
              borderRadius: 22,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 16px 44px rgba(0,0,0,0.4)',
              background: 'transparent'
            }}>
              <video
                src={project.videoUrl}
                controls
                autoPlay
                loop
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  background: 'transparent',
                  borderRadius: 22
                }}
              />
            </div>
          </div>
        );
      } else {
        return (
          <div style={{
            position: 'relative',
            width: '100%',
            padding: isFullScreen ? '24px 0 12px' : '16px 0 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '100%',
              maxWidth: 1040,
              margin: '0 auto',
              borderRadius: 22,
              overflow: 'hidden',
              boxShadow: '0 16px 44px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent'
            }}>
              <video
                src={project.videoUrl}
                controls
                autoPlay
                loop
                playsInline
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: isFullScreen ? '78vh' : '650px',
                  objectFit: 'contain',
                  display: 'block',
                  background: 'transparent',
                  borderRadius: 22
                }}
              />
            </div>
          </div>
        );
      }
    }

    if (allImages.length > 0) {
      if (isPortrait) {
        return (
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'transparent',
            padding: isFullScreen ? '24px 20px' : '16px 14px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              maxWidth: isFullScreen ? 460 : 400,
              borderRadius: 22,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 16px 44px rgba(0,0,0,0.4)',
              position: 'relative',
              background: 'transparent'
            }}>
              <img
                src={allImages[currentImageIdx]}
                alt={`${title} - Preview ${currentImageIdx + 1}`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain', 
                  display: 'block',
                  borderRadius: 22
                }}
              />
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIdx((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.65)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 5
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentImageIdx((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.65)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 5
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>

                  <div style={{
                    position: 'absolute',
                    bottom: 14,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 20,
                    background: 'rgba(0,0,0,0.65)',
                    zIndex: 5
                  }}>
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIdx(idx)}
                        style={{
                          width: currentImageIdx === idx ? 18 : 6,
                          height: 6,
                          borderRadius: 3,
                          border: 'none',
                          padding: 0,
                          background: currentImageIdx === idx ? accentColor : 'rgba(255,255,255,0.4)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      } else {
        return (
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            padding: isFullScreen ? '24px 0 12px' : '16px 0 8px',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'transparent',
            boxSizing: 'border-box' 
          }}>
            <div style={{
              width: '100%',
              maxWidth: 1040,
              margin: '0 auto',
              borderRadius: 22,
              overflow: 'hidden',
              boxShadow: '0 16px 44px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              background: 'transparent'
            }}>
              <img
                src={allImages[currentImageIdx]}
                alt={`${title} - Preview ${currentImageIdx + 1}`}
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  maxHeight: isFullScreen ? '78vh' : '650px', 
                  objectFit: 'contain', 
                  display: 'block',
                  borderRadius: 22 
                }}
              />
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIdx((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.65)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 5
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentImageIdx((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.65)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 5
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>

                  <div style={{
                    position: 'absolute',
                    bottom: 14,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 20,
                    background: 'rgba(0,0,0,0.65)',
                    zIndex: 5
                  }}>
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIdx(idx)}
                        style={{
                          width: currentImageIdx === idx ? 18 : 6,
                          height: 6,
                          borderRadius: 3,
                          border: 'none',
                          padding: 0,
                          background: currentImageIdx === idx ? accentColor : 'rgba(255,255,255,0.4)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      }
    }

    return null;
  };

  // Reusable Details Content
  const renderDetails = () => (
    <div style={{ 
      padding: isFullScreen ? '16px 0 60px' : '16px 0 40px', 
      width: '100%',
      maxWidth: 1040,
      margin: '0 auto',
      boxSizing: 'border-box' 
    }}>
      {/* Title & Metadata */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: isFullScreen ? 28 : 22,
          fontWeight: 900,
          color: textColor,
          margin: '0 0 12px',
          letterSpacing: '-0.5px',
          lineHeight: 1.25,
        }}>
          {title}
        </h2>

        {/* Project Details Pill Bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          padding: '10px 14px',
          borderRadius: 14,
          background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
          border: `1px solid ${borderColor}`,
          marginBottom: 18,
        }}>
          {project.client && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter', sans-serif", fontSize: 13, color: subTextColor }}>
              <Building size={13} style={{ color: accentColor }} />
              <span><strong style={{ color: textColor }}>Klien:</strong> {project.client}</span>
            </div>
          )}
          {project.year && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter', sans-serif", fontSize: 13, color: subTextColor }}>
              <Calendar size={13} style={{ color: accentColor }} />
              <span><strong style={{ color: textColor }}>Tahun:</strong> {project.year}</span>
            </div>
          )}
          {toolsList.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter', sans-serif", fontSize: 13, color: subTextColor }}>
              <Tag size={13} style={{ color: accentColor }} />
              <span><strong style={{ color: textColor }}>Software:</strong> {toolsList.join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tools & Software Badges */}
      {toolsList.length > 0 && (
        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${borderColor}` }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: subTextColor, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
            Tools & Software Digunakan:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {toolsList.map((tool) => (
              <SoftwareBadge key={tool} name={tool} size="md" isDark={isDark} showCategory={true} />
            ))}
          </div>
        </div>
      )}

      {/* Description (Case Study HTML) */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: subTextColor, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
          Deskripsi & Studi Kasus:
        </div>
        {project.description ? (
          <div
            className="lp-case-study"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 14.5,
              color: subTextColor,
              lineHeight: 1.8,
              margin: 0,
              wordBreak: 'break-word'
            }}
            dangerouslySetInnerHTML={{ __html: safeHtml(project.description) }}
          />
        ) : (
          <p style={{ color: subTextColor, fontSize: 13.5, fontStyle: 'italic', margin: 0 }}>
            Tidak ada deskripsi rinci untuk proyek ini.
          </p>
        )}
      </div>

      {/* Stacked Gallery for Image Type */}
      {(project.mediaType === 'image' || !project.mediaType) && allImages.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
            Galeri Tambahan:
          </div>
          {allImages.slice(1).map((img, i) => (
            <img 
              key={i} 
              src={img} 
              alt={`${title} - Gallery ${i + 1}`} 
              loading="lazy"
              style={{ width: '100%', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} 
            />
          ))}
        </div>
      )}

      {/* ── REKOMENDASI KARYA LAIN (SUGGESTED PROJECTS) ── */}
      {suggestedProjects.length > 0 && (
        <div style={{ marginTop: 40, paddingTop: 28, borderTop: `1px solid ${borderColor}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color={accentColor} />
              <h4 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900, color: textColor }}>
                Karya Lainnya yang Menarik
              </h4>
            </div>
            <span style={{ fontSize: 11.5, color: subTextColor }}>Jelajahi portofolio</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12
          }}>
            {suggestedProjects.map((item) => {
              const cover = getCoverForProject(item);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (onSelectProject) {
                      onSelectProject(item);
                    }
                  }}
                  style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                    border: `1px solid ${borderColor}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = accentColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = borderColor;
                  }}
                >
                  <div style={{ width: '100%', aspectRatio: '16/10', background: '#090a12', overflow: 'hidden' }}>
                    {cover ? (
                      <img
                        src={cover}
                        alt={item.name || item.title || 'Project'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subTextColor, fontSize: 12 }}>
                        Preview
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {item.category && (
                        <span style={{ fontSize: 9.5, fontWeight: 800, color: accentColor, textTransform: 'uppercase' }}>
                          {item.category}
                        </span>
                      )}
                      <div style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: textColor,
                        marginTop: 2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.name || item.title || 'Untitled'}
                      </div>
                    </div>
                    <div style={{
                      marginTop: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      color: accentColor,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3
                    }}>
                      Lihat Karya <ArrowUpRight size={11} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        display: 'flex',
        alignItems: isFullScreen ? 'stretch' : 'center',
        justifyContent: 'center',
        padding: isFullScreen ? 0 : '16px',
        background: 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        animation: 'lpFadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        className="lp-project-modal-card"
        style={{
          width: isFullScreen ? '100vw' : '100%',
          maxWidth: isFullScreen ? '100vw' : (isPortraitVideo ? 1040 : 960),
          height: isFullScreen ? '100dvh' : '88vh',
          maxHeight: isFullScreen ? '100dvh' : '90vh',
          background: bgColor,
          borderRadius: isFullScreen ? 0 : 28,
          border: isFullScreen ? 'none' : `1px solid ${borderColor}`,
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          overflow: isPortraitVideo ? 'hidden' : 'auto',
          animation: 'lpScaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BAR / HEADER (Sticky at Top) */}
        <div style={{
          padding: '14px 22px',
          borderBottom: `1px solid ${borderColor}`,
          background: headerBg,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          zIndex: 20,
          position: 'sticky',
          top: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, paddingRight: 16 }}>
            {project.category && (
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 100,
                background: `${accentColor}18`,
                color: accentColor,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11.5,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                flexShrink: 0
              }}>
                {project.category}
              </span>
            )}
            <h3 style={{
              margin: 0,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 16,
              fontWeight: 800,
              color: textColor,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {title}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setIsFullScreen((prev) => !prev)}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: `1px solid ${borderColor}`,
                background: cardBg,
                color: textColor,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              title={isFullScreen ? 'Keluar Fullscreen' : 'Fullscreen'}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: `1px solid ${borderColor}`,
                background: cardBg,
                color: textColor,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              title="Tutup (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        {isPortraitVideo ? (
          <div
            className="lp-portrait-split-body"
            style={{
              display: 'flex',
              flex: 1,
              overflow: 'hidden',
              minHeight: 0
            }}
          >
            {/* Left: Video Column */}
            <div
              className="lp-portrait-media-col"
              style={{
                flex: '1 1 52%',
                maxWidth: '55%',
                height: '100%',
                borderRight: `1px solid ${borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                overflow: 'hidden'
              }}
            >
              {renderMedia()}
            </div>

            {/* Right: Scrollable Details Column */}
            <div
              className="lp-portrait-content-col"
              style={{
                flex: '1 1 48%',
                height: '100%',
                overflowY: 'auto',
                padding: '24px 28px'
              }}
            >
              {renderDetails()}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
            {renderMedia()}
            {renderDetails()}
          </div>
        )}
      </div>

      <style>{`
        @keyframes lpFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lpScaleIn { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

        @media (max-width: 820px) {
          .lp-portrait-split-body {
            flex-direction: column !important;
            overflow-y: auto !important;
          }
          .lp-portrait-media-col {
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            min-height: 380px !important;
            border-right: none !important;
            border-bottom: 1px solid ${borderColor} !important;
          }
          .lp-portrait-content-col {
            height: auto !important;
            overflow-y: visible !important;
          }
        }

        /* Case Study HTML typography */
        .lp-case-study h3 { color: ${textColor}; font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 800; margin: 24px 0 12px; }
        .lp-case-study h4 { color: ${textColor}; font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700; margin: 18px 0 8px; }
        .lp-case-study p { margin: 0 0 12px; }
        .lp-case-study ul { margin: 0 0 18px; padding-left: 20px; }
        .lp-case-study li { margin-bottom: 5px; }
      `}</style>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};

export default LPProjectModal;
