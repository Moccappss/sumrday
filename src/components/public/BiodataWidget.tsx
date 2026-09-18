import React, { useState, useEffect } from 'react';
import { 
  Building, MapPin, Send, Phone, Link as LinkIcon, 
  Code, Camera, Award, Globe, Briefcase, GraduationCap, Users, Medal,
  ChevronDown, ChevronUp, ExternalLink, Verified, Star, MessageCircle
} from 'lucide-react';
import { storage } from '../../utils/storage';

interface BiodataWidgetProps {
  settings?: any;
  block?: any;
}

const DEFAULT_SECTION_ORDER = ['experience', 'organizations', 'education', 'certifications', 'skills'];

const BiodataWidget: React.FC<BiodataWidgetProps> = ({ settings, block }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [liveBiodata, setLiveBiodata] = useState<any>(() => settings?.biodata || {});
  const [liveContacts, setLiveContacts] = useState<any[]>([]);

  const config = {
    cvMode: block?.biodataConfig?.cvMode || 'auto',
    showExperience: block?.biodataConfig?.showExperience !== false,
    showEducation: block?.biodataConfig?.showEducation !== false,
    showSkills: block?.biodataConfig?.showSkills !== false,
    showOrganizations: block?.biodataConfig?.showOrganizations !== false,
    showCertifications: block?.biodataConfig?.showCertifications !== false,
    showBio: block?.biodataConfig?.showBio !== false,
    showContact: block?.biodataConfig?.showContact !== false,
    sectionOrder: block?.biodataConfig?.sectionOrder || DEFAULT_SECTION_ORDER,
  };

  const [isCvExpanded, setIsCvExpanded] = useState(config.cvMode === 'always_expanded');

  useEffect(() => {
    if (config.cvMode === 'always_expanded') setIsCvExpanded(true);
    else if (config.cvMode === 'always_collapsed') setIsCvExpanded(false);
  }, [config.cvMode]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch and sync real-time biodata & contacts
  useEffect(() => {
    let isMounted = true;
    const syncData = async () => {
      try {
        const [bio, contactsList, s] = await Promise.all([
          storage.getItem('porto_biodata', null),
          storage.getItem('porto_contacts', []),
          storage.getItem('porto_settings', {})
        ]);
        if (!isMounted) return;
        const effectiveBio = bio || s?.biodata || settings?.biodata || {};
        setLiveBiodata(effectiveBio);
        if (Array.isArray(contactsList)) {
          setLiveContacts(contactsList.filter((c: any) => c.url));
        }
      } catch (err) {
        console.error('[BiodataWidget] Sync error:', err);
      }
    };

    syncData();

    const unsubBio = storage.listenItem('porto_biodata', (newBio) => {
      if (isMounted && newBio && typeof newBio === 'object') {
        setLiveBiodata(newBio);
      }
    });

    const unsubContacts = storage.listenItem('porto_contacts', (newContacts) => {
      if (isMounted && Array.isArray(newContacts)) {
        setLiveContacts(newContacts.filter((c: any) => c.url));
      }
    });

    const handleCustomUpdate = (e: any) => {
      if (e?.detail) setLiveBiodata(e.detail);
      else syncData();
    };

    window.addEventListener('porto_biodata_updated', handleCustomUpdate);
    window.addEventListener('porto_saved', syncData);
    window.addEventListener('porto_settings_updated', syncData);

    return () => {
      isMounted = false;
      if (typeof unsubBio === 'function') unsubBio();
      if (typeof unsubContacts === 'function') unsubContacts();
      window.removeEventListener('porto_biodata_updated', handleCustomUpdate);
      window.removeEventListener('porto_saved', syncData);
      window.removeEventListener('porto_settings_updated', syncData);
    };
  }, [settings?.biodata]);

  const biodata = liveBiodata || settings?.biodata || {};


  // Section components as renderable objects
  const leftSections: Record<string, React.ReactNode> = {
    experience: config.showExperience && biodata?.experiences && biodata.experiences.length > 0 ? (
      <TimelineSection
        key="experience"
        icon={<Briefcase size={16} />}
        title="PENGALAMAN KERJA"
        color="#f59e0b"
        bgColor="rgba(245,158,11,0.1)"
        items={biodata.experiences.map((exp: any) => ({
          title: exp.role,
          subtitle: exp.company,
          period: `${exp.startYear} — ${exp.endYear || 'Sekarang'}`,
          description: exp.description
        }))}
      />
    ) : null,

    organizations: config.showOrganizations && biodata?.organizations && biodata.organizations.length > 0 ? (
      <TimelineSection
        key="organizations"
        icon={<Users size={16} />}
        title="PENGALAMAN ORGANISASI"
        color="#8b5cf6"
        bgColor="rgba(139,92,246,0.1)"
        items={biodata.organizations.map((org: any) => ({
          title: org.role,
          subtitle: org.name,
          period: `${org.startYear} — ${org.endYear || 'Sekarang'}`,
          description: org.description
        }))}
      />
    ) : null,
  };

  const rightSections: Record<string, React.ReactNode> = {
    education: config.showEducation && biodata?.education && biodata.education.length > 0 ? (
      <TimelineSection
        key="education"
        icon={<GraduationCap size={16} />}
        title="PENDIDIKAN"
        color="#3b82f6"
        bgColor="rgba(59,130,246,0.1)"
        items={biodata.education.map((edu: any) => ({
          title: edu.degree,
          subtitle: edu.institution,
          period: `${edu.startYear} — ${edu.endYear || 'Sekarang'}`,
          description: edu.description
        }))}
      />
    ) : null,

    certifications: config.showCertifications && biodata?.certifications && biodata.certifications.length > 0 ? (
      <div key="certifications" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionHeader icon={<Medal size={16} />} title="SERTIFIKASI" color="#eab308" bgColor="rgba(234,179,8,0.1)" />
        {biodata.certifications.map((cert: any, idx: number) => (
          <div key={idx} style={{
            padding: '12px 14px',
            background: 'var(--cms-input-bg)',
            borderRadius: 12,
            border: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)', lineHeight: 1.3 }}>{cert.name}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#eab308' }}>{cert.issuer}</div>
            <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 600 }}>Tahun {cert.year}</div>
            {cert.credentialUrl && (
              <a href={cert.credentialUrl} target="_blank" rel="noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 700, color: 'var(--cms-accent)',
                textDecoration: 'none', marginTop: 4,
              }}>
                <ExternalLink size={11} /> Lihat Kredensial
              </a>
            )}
          </div>
        ))}
      </div>
    ) : null,

    skills: config.showSkills ? (
      <div key="skills" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {biodata?.skills && biodata.skills.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SectionHeader icon={<Award size={16} />} title="KEAHLIAN" color="#8b5cf6" bgColor="rgba(139,92,246,0.1)" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {biodata.skills.map((skill: string, idx: number) => (
                <span key={idx} style={{
                  background: 'var(--cms-card-bg)',
                  color: 'var(--cms-text)',
                  border: '1px solid var(--glass-border)',
                  padding: '5px 10px',
                  borderRadius: 100,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '-0.01em'
                }}>{skill}</span>
              ))}
            </div>
          </div>
        )}
        {biodata?.languages && biodata.languages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SectionHeader icon={<Globe size={16} />} title="BAHASA" color="#10b981" bgColor="rgba(16,185,129,0.1)" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {biodata.languages.map((lang: string, idx: number) => (
                <span key={idx} style={{
                  background: 'var(--cms-card-bg)',
                  color: 'var(--cms-text)',
                  border: '1px solid var(--glass-border)',
                  padding: '5px 10px',
                  borderRadius: 100,
                  fontSize: 12,
                  fontWeight: 700,
                }}>{lang}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    ) : null,
  };

  // Build ordered section list
  const allSections: Record<string, React.ReactNode> = { ...leftSections, ...rightSections };

  const orderedLeft: React.ReactNode[] = [];
  const orderedRight: React.ReactNode[] = [];

  const orderedKeys = config.sectionOrder.filter(k => !!allSections[k]);
  const midpoint = Math.ceil(orderedKeys.length / 2);

  orderedKeys.forEach((key, idx) => {
    const node = allSections[key];
    if (!node) return;
    if (!isMobile) {
      if (idx < midpoint) orderedLeft.push(node);
      else orderedRight.push(node);
    } else {
      orderedLeft.push(node);
    }
  });

  return (
    <div style={{
      width: '100%',
      background: 'var(--cms-card-bg)',
      borderRadius: 20,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', -apple-system, sans-serif",
      position: 'relative',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      border: '1px solid var(--glass-border)',
      lineHeight: 1.5,
      fontSize: 15
    }}>

      {/* ── Cover ── */}
      <div style={{
        width: '100%',
        height: isMobile ? 100 : 130,
        background: `url(${biodata?.coverUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1000'}) center/cover`,
        position: 'relative',
        flexShrink: 0,
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)' }} />
      </div>

      {/* ── Header Area ── */}
      <div style={{ padding: isMobile ? '0 16px 20px' : '0 32px 24px', position: 'relative' }}>

        {/* Avatar row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: -44,
          marginBottom: 16,
        }}>
          {/* Avatar */}
          <div style={{
            width: isMobile ? 80 : 96,
            height: isMobile ? 80 : 96,
            borderRadius: 16,
            background: biodata?.avatarUrl ? `url(${biodata.avatarUrl}) center/cover` : 'var(--cms-accent-soft, rgba(124, 58, 237, 0.15))',
            border: '3px solid var(--cms-card-bg)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            zIndex: 2,
            position: 'relative',
            flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', bottom: -5, right: -5,
              background: '#10b981', color: '#fff',
              borderRadius: '50%', padding: 3,
              border: '2px solid var(--cms-card-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Verified size={13} />
            </div>
          </div>

          {/* Toggle / expand button */}
          {config.cvMode === 'auto' && (
            <button
              onClick={() => setIsCvExpanded(!isCvExpanded)}
              style={{
                height: 36, padding: '0 14px',
                borderRadius: 100,
                background: isCvExpanded ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-input-bg)',
                border: isCvExpanded ? 'none' : '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', gap: 6,
                color: isCvExpanded ? '#fff' : 'var(--cms-text)',
                fontSize: 12, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.25s',
                boxShadow: isCvExpanded ? '0 4px 12px rgba(var(--cms-accent-rgb),0.25)' : 'none',
                zIndex: 2, flexShrink: 0,
              }}
            >
              {isCvExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {isCvExpanded ? 'Sembunyikan CV' : 'Lihat CV Lengkap'}
            </button>
          )}
        </div>

        {/* Name & Role */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 14 }}>
          <h1 style={{
            fontSize: isMobile ? 22 : 26,
            fontWeight: 900,
            color: 'var(--cms-text)',
            letterSpacing: '-0.03em',
            margin: 0, lineHeight: 1.2
          }}>
            {biodata?.fullName || 'Nama Lengkap'}
          </h1>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cms-accent, #7c3aed)', letterSpacing: '-0.01em' }}>
            {biodata?.role || 'Role / Profesi'}
          </div>
          {biodata?.experienceYears && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--cms-text-muted)', fontWeight: 600 }}>
              <Star size={12} style={{ opacity: 0.6 }} />
              {biodata.experienceYears} tahun pengalaman
            </div>
          )}
        </div>

        {/* Contact badges */}
        {config.showContact && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
            {biodata?.email && (
              <a href={`mailto:${biodata.email}`} style={contactBadgeStyle}>
                <Send size={12} /> {biodata.email}
              </a>
            )}
            {biodata?.phone && (
              <a href={`tel:${biodata.phone}`} style={contactBadgeStyle}>
                <Phone size={12} /> {biodata.phone}
              </a>
            )}
            {biodata?.location && (
              <span style={contactBadgeStyle}>
                <MapPin size={12} /> {biodata.location}
              </span>
            )}
            {biodata?.website && (
              <a href={biodata.website} target="_blank" rel="noreferrer" style={{ ...contactBadgeStyle, color: 'var(--cms-accent)', background: 'rgba(var(--cms-accent-rgb),0.08)', borderColor: 'rgba(var(--cms-accent-rgb),0.2)' }}>
                <LinkIcon size={12} /> Website
              </a>
            )}
          </div>
        )}

        {/* Social Links & Platform Badges */}
        {config.showContact && (() => {
          const ensureUrl = (u: string) => (u.startsWith('http://') || u.startsWith('https://')) ? u : `https://${u}`;
          const renderedSocials: React.ReactNode[] = [];
          const seenNames = new Set<string>();

          // 1. LinkedIn
          if (biodata?.socialLinks?.linkedin) {
            seenNames.add('linkedin');
            renderedSocials.push(
              <a key="linkedin" href={ensureUrl(biodata.socialLinks.linkedin)} target="_blank" rel="noopener noreferrer" style={{
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', background: '#0a66c2', color: '#fff',
                borderRadius: 100, fontSize: 12, fontWeight: 700,
                boxShadow: '0 2px 8px rgba(10,102,194,0.3)', transition: 'transform 0.2s ease'
              }}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg> LinkedIn
              </a>
            );
          }


          // 2. GitHub
          if (biodata?.socialLinks?.github) {
            seenNames.add('github');
            renderedSocials.push(
              <a key="github" href={ensureUrl(biodata.socialLinks.github)} target="_blank" rel="noopener noreferrer" style={{
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', background: '#24292e', color: '#fff',
                borderRadius: 100, fontSize: 12, fontWeight: 700,
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)', transition: 'transform 0.2s ease'
              }}>
                <Code size={13} /> GitHub
              </a>
            );
          }

          // 3. Instagram
          if (biodata?.socialLinks?.instagram) {
            seenNames.add('instagram');
            renderedSocials.push(
              <a key="instagram" href={ensureUrl(biodata.socialLinks.instagram)} target="_blank" rel="noopener noreferrer" style={{
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px',
                background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                color: '#fff', borderRadius: 100, fontSize: 12, fontWeight: 700,
                boxShadow: '0 2px 8px rgba(220,39,67,0.3)', transition: 'transform 0.2s ease'
              }}>
                <Camera size={13} /> Instagram
              </a>
            );
          }

          // 4. Other entries from liveContacts (e.g. WhatsApp, YouTube, Telegram, Custom Links)
          (liveContacts || []).forEach((c: any) => {
            const nameLower = (c.name || '').toLowerCase().trim();
            if (seenNames.has(nameLower) || !c.url) return;
            seenNames.add(nameLower);

            renderedSocials.push(
              <a 
                key={c.id || c.name} 
                href={ensureUrl(c.url)} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', 
                  background: c.iconBg || 'var(--cms-input-bg)', 
                  color: c.iconBg ? '#fff' : 'var(--cms-text)',
                  border: c.iconBg ? 'none' : '1px solid var(--glass-border)',
                  borderRadius: 100, fontSize: 12, fontWeight: 700,
                  transition: 'transform 0.2s ease'
                }}
              >
                {c.iconSvg ? (
                  <div style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: c.iconSvg }} />
                ) : (
                  <Globe size={13} />
                )}
                <span>{c.name || 'Tautan'}</span>
              </a>
            );
          });

          if (renderedSocials.length === 0) return null;

          return (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              {renderedSocials}
            </div>
          );
        })()}


        {/* Bio */}
        {config.showBio && biodata?.bio && (
          <div style={{
            padding: '12px 16px',
            background: 'var(--cms-input-bg)',
            borderRadius: 12,
            borderLeft: '3px solid var(--cms-accent)',
            fontSize: 13, lineHeight: 1.7,
            color: 'var(--cms-text)',
            marginBottom: 4,
          }}>
            {biodata.bio}
          </div>
        )}
      </div>

      {/* ── CV Sections ── */}
      {isCvExpanded && (
        <div style={{
          padding: isMobile ? '20px 16px 24px' : '24px 32px 32px',
          borderTop: '1px solid var(--glass-border)',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr',
          gap: isMobile ? 28 : 40,
        }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {orderedLeft.map((node, i) => <React.Fragment key={i}>{node}</React.Fragment>)}
          </div>

          {/* Right column (hidden on mobile since all go to left column) */}
          {!isMobile && orderedRight.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {orderedRight.map((node, i) => <React.Fragment key={i}>{node}</React.Fragment>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Sub-components ── */

const contactBadgeStyle: React.CSSProperties = {
  textDecoration: 'none',
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '5px 10px',
  background: 'var(--cms-input-bg)',
  borderRadius: 100,
  fontSize: 12, fontWeight: 600,
  color: 'var(--cms-text-muted)',
  border: '1px solid var(--glass-border)',
  letterSpacing: '-0.01em',
};

const SectionHeader = ({ icon, title, color, bgColor }: { icon: React.ReactNode; title: string; color: string; bgColor: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
    <div style={{
      width: 28, height: 28, borderRadius: 8,
      background: bgColor, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {icon}
    </div>
    <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      {title}
    </span>
    <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
  </div>
);

interface TimelineItem {
  title: string;
  subtitle: string;
  period: string;
  description?: string;
}

const TimelineSection = ({
  icon, title, color, bgColor, items
}: {
  icon: React.ReactNode; title: string; color: string; bgColor: string; items: TimelineItem[]
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <SectionHeader icon={icon} title={title} color={color} bgColor={bgColor} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 4 }}>
      {items.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 14, position: 'relative', paddingBottom: idx < items.length - 1 ? 20 : 0 }}>
          {/* Timeline line & dot */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 16 }}>
            <div style={{
              width: 12, height: 12,
              borderRadius: '50%',
              background: 'var(--cms-card-bg)',
              border: `3px solid ${color}`,
              boxShadow: `0 0 0 3px ${color}22`,
              flexShrink: 0, marginTop: 3,
              zIndex: 1,
            }} />
            {idx < items.length - 1 && (
              <div style={{
                flex: 1, width: 2,
                background: `linear-gradient(to bottom, ${color}55, transparent)`,
                marginTop: 4, borderRadius: 2,
                minHeight: 20,
              }} />
            )}
          </div>
          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cms-text)', lineHeight: 1.3 }}>{item.title}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color, marginTop: 2 }}>{item.subtitle}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cms-text-muted)', marginTop: 2, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              {item.period}
            </div>
            {item.description && (
              <div style={{ fontSize: 12, marginTop: 6, color: 'var(--cms-text-muted)', lineHeight: 1.6 }}>
                {item.description}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default BiodataWidget;
