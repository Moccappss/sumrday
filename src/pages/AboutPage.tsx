import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, Mail, Phone, Globe, Award, Briefcase, GraduationCap,
  Users, ExternalLink, Download, Copy, Sparkles, Code2, Languages,
  ArrowUpRight, Building2, CalendarDays, ChevronRight, Target, Zap, CheckCircle2,
} from 'lucide-react';
import { useLandingData } from '../components/landing/useLandingData';
import LPNavbar from '../components/landing/LPNavbar';
import LPFooter from '../components/landing/LPFooter';
import { storage } from '../utils/storage';
import { useLandingBodyFix } from '../hooks/useLandingBodyFix';
import SEOHelmet from '../components/SEOHelmet';
import { useToast } from '../context/ToastContext';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

/* ─────────────── Helpers ─────────────── */
const hex2rgb = (hex: string) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
};

/* ─────────────── Social icon mapping ─────────────── */
const SOCIAL_ICONS: Record<string, string> = {
  instagram: 'IG', linkedin: 'in', github: 'GH', twitter: 'TW',
  youtube: 'YT', facebook: 'FB', tiktok: 'TK', behance: 'Be',
  dribbble: 'Dr', pinterest: 'Pi', telegram: 'Tg', whatsapp: 'WA',
};

/* ═══════════════════════════════════════ */
const AboutPage: React.FC = () => {
  const { data, isLoading: isLandingLoading } = useLandingData();
  const [biodata, setBiodata] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useScrollReveal(containerRef, [biodata, data]);

  // Force body/html/root scrollable (overrides global CMS fixed-body CSS)
  useLandingBodyFix();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        let bio = await storage.getItem('porto_biodata', null);
        if (!bio) {
          const s = await storage.getItem('porto_settings', {});
          if (s?.biodata) bio = s.biodata;
        }
        if (isMounted && bio) setBiodata(bio);
      } catch { /* silent */ } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    const u1 = storage.listenItem('porto_biodata', (v) => { if (isMounted && v) setBiodata(v); });
    const u2 = storage.listenItem('porto_settings', (s) => { if (isMounted && s?.biodata) setBiodata(s.biodata); });
    return () => { isMounted = false; if (typeof u1 === 'function') u1(); if (typeof u2 === 'function') u2(); };
  }, []);

  /* Unified website theme hook */
  const { isDark } = useWebsiteTheme(data?.theme?.defaultMode);

  /* Design tokens */
  const accent = (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || data?.theme?.accentColor || '#64748b';
  const accentRgb = hex2rgb(accent);
  const bg        = isDark ? '#08080f' : '#f4f6fb';
  const textPri   = isDark ? '#f1f5f9' : '#0d1117';
  const textSub   = isDark ? '#8899b4' : '#5a6a82';
  const glass     = isDark ? 'rgba(20,28,44,0.7)' : 'rgba(255,255,255,0.82)';
  const glassHover= isDark ? 'rgba(30,42,62,0.9)' : 'rgba(255,255,255,1)';
  const border    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  if (isLandingLoading || isLoading) return <div style={{ minHeight: '100vh', background: bg }} />;

  const isCompanyMode = data?.aboutSettings?.mode === 'company';
  const companyProfile = data?.aboutSettings?.company || {
    name: 'sumr.day',
    tagline: 'A little sunshine for your screen | Creative Digital Studio',
    badge: 'RUANG CERITA & STUDIO',
    description: 'sumr.day adalah Creative Digital Studio berkonsep Warm Tech & Skena-Aesthetic. Kami menghadirkan interaksi digital (undangan web, landing page, aset visual) secara hangat, santai, dan penuh energi positif khas musim panas.',
    foundedYear: '2024',
    headquarters: 'Indonesia (Remote & Creative Hub)',
    teamSize: 'Kolektif Kreatif',
    website: 'https://sumrday.web.app',
    email: 'hi.sumrday@gmail.com',
    phone: '+62 812-3456-7890',
    vision: 'Membawa keceriaan, kehangatan visual, dan estetika segar ke dalam setiap interaksi layar digital.',
    mission: [
      'Meracik undangan web dan landing page dengan estetika skena yang rapi, segar, dan ramah pengguna.',
      'Memadukan teknologi interaktif modern (Warm Tech) dengan sentuhan rasa yang hangat dan berjiwa muda.',
      'Menjadi ruang kolaborasi kreatif yang asyik, santai, transparan, dan membahagiakan.'
    ],
    coreValues: [
      { id: 'v1', title: 'Sunshine Energy', description: 'Menebarkan energi positif, keceriaan, dan antusiasme di setiap proyek.', icon: 'Sparkles' },
      { id: 'v2', title: 'Warm Tech', description: 'Teknologi modern yang ramah, intuitif, dan tidak kaku.', icon: 'Cpu' },
      { id: 'v3', title: 'Skena-Aesthetic', description: 'Eksplorasi visual trendi, clean, dan penuh karakter generasi masa kini.', icon: 'Palette' },
      { id: 'v4', title: 'Chill Collab', description: 'Komunikasi santai, transparan, dan eksekusi tepat waktu.', icon: 'Zap' }
    ],
    stats: [
      { id: 's1', label: 'Karya Terbit', value: '100+' },
      { id: 's2', label: 'Klien Puas', value: '99%' },
      { id: 's3', label: 'Energi Positif', value: '100%' },
      { id: 's4', label: 'Tahun Eksplorasi', value: '3+' }
    ],
    teamMembers: [
      { id: 'tm1', name: 'Arif Wicaksono', role: 'Founder & Principal Designer', photo: '', bio: 'Memimpin visi kreatif dan sistem desain visual.' },
      { id: 'tm2', name: 'Nadia Salsabila', role: 'Lead UI/UX Strategist', photo: '', bio: 'Spesialis riset pengguna dan wireframing.' }
    ],
    milestones: [
      { id: 'm1', year: '2022', title: 'Studio Didirikan', description: 'Memulai perjalanan sebagai studio desain independen.' },
      { id: 'm2', year: '2024', title: 'Ekspansi Layanan Full-Stack', description: 'Memperluas kapabilitas ke perancangan CMS custom dan web app.' }
    ],
    clients: [
      { id: 'c1', name: 'TechIndo Global' },
      { id: 'c2', name: 'Kopi Nusantara' },
      { id: 'c3', name: 'Nusantara Logistics' }
    ]
  };

  const name       = biodata?.fullName || data?.hero?.headline || 'Nama Saya';
  const role       = biodata?.role || data?.hero?.subheadline || 'Professional';
  const company    = biodata?.company || '';
  const bio        = biodata?.fullBio || data?.profile?.fullBio || biodata?.bio || data?.profile?.bio || '';
  const skills     = biodata?.skills || data?.profile?.skills || [];
  const avatarUrl  = biodata?.avatarUrl || biodata?.coverUrl || data?.hero?.heroImage || '';
  const nameParts  = name.split(' ');
  const initials   = nameParts.length >= 2
    ? nameParts[0][0] + nameParts[1][0]
    : name.substring(0, 2);

  const copy = (text: string, label: string) => {
    if (navigator.clipboard) { navigator.clipboard.writeText(text); showToast(`${label} disalin!`, text, 'success'); }
  };

  /* ── Download Company Profile PDF ── */
  const downloadCompanyProfile = async () => {
    const compName = companyProfile.name || 'Company Profile';
    const statsHTML = (companyProfile.stats || []).map((s: any) => `
      <div style="flex: 1; text-align: center; background: ${accent}12; padding: 10px; border-radius: 8px; border: 1px solid ${accent}25;">
        <div style="font-size: 16pt; font-weight: 900; color: ${accent};">${s.value}</div>
        <div style="font-size: 7.5pt; font-weight: 700; color: #475569; text-transform: uppercase;">${s.label}</div>
      </div>
    `).join('');

    const missionHTML = (companyProfile.mission || []).map((m: string) => `
      <li style="margin-bottom: 6px; font-size: 8.5pt; color: #475569;">${m}</li>
    `).join('');

    const valuesHTML = (companyProfile.coreValues || []).map((v: any) => `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 8px;">
        <div style="font-size: 9.5pt; font-weight: 800; color: #0f172a; margin-bottom: 2px;">${v.title}</div>
        <div style="font-size: 8pt; color: #64748b; line-height: 1.4;">${v.description}</div>
      </div>
    `).join('');

    const teamHTML = (companyProfile.teamMembers || []).map((t: any) => `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 8px;">
        <div style="font-size: 9.5pt; font-weight: 800; color: #0f172a;">${t.name}</div>
        <div style="font-size: 8pt; font-weight: 700; color: ${accent}; margin-bottom: 3px;">${t.role}</div>
        <div style="font-size: 7.5pt; color: #64748b; line-height: 1.4;">${t.bio}</div>
      </div>
    `).join('');

    const milestonesHTML = (companyProfile.milestones || []).map((m: any) => `
      <div style="margin-bottom: 8px; padding-left: 10px; border-left: 2px solid ${accent};">
        <div style="display: flex; justify-content: space-between; font-size: 8.5pt; font-weight: 800; color: #0f172a;">
          <span>${m.title}</span>
          <span style="color: ${accent}; font-weight: 700;">${m.year}</span>
        </div>
        <div style="font-size: 8pt; color: #64748b;">${m.description}</div>
      </div>
    `).join('');

    const htmlContent = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Inter:wght@400;500;600&display=swap');
  #comp-export-container * { box-sizing: border-box; margin: 0; padding: 0; }
  #comp-export-container {
    font-family: 'Inter', sans-serif;
    color: #1e293b; background: #fff;
    font-size: 10.5pt; line-height: 1.6;
    width: 210mm;
    min-height: 297mm;
    position: relative;
    display: flex; flex-direction: column;
  }
  #comp-export-container .header {
    background: linear-gradient(135deg, ${accent} 0%, #1e1b4b 100%);
    padding: 32px 14mm;
    color: #fff;
    position: relative; overflow: hidden;
  }
  #comp-export-container .body {
    padding: 24px 14mm;
    display: flex; flex-direction: column; gap: 20px;
    flex: 1;
  }
  #comp-export-container .section-title {
    font-family: 'Outfit', sans-serif; font-size: 12pt; font-weight: 800;
    color: #0f172a; margin-bottom: 8px;
    border-bottom: 1.5px solid ${accent}40; padding-bottom: 4px;
  }
</style>
<div id="comp-export-container">
  <div class="header">
    <div style="font-size: 8pt; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 100px; display: inline-block; margin-bottom: 6px;">
      ${companyProfile.badge || 'PROFIL PERUSAHAAN & STUDIO'}
    </div>
    <div style="font-family: 'Outfit', sans-serif; font-size: 24pt; font-weight: 900; line-height: 1.1; margin-bottom: 4px;">
      ${companyProfile.name || 'Company Name'}
    </div>
    <div style="font-size: 11pt; font-weight: 600; opacity: 0.92; margin-bottom: 12px;">
      ${companyProfile.tagline || ''}
    </div>
    <div style="display: flex; gap: 14px; font-size: 8.5pt; opacity: 0.85; flex-wrap: wrap;">
      <span>&#128205; ${companyProfile.headquarters || ''}</span>
      <span>&#128197; Berdiri: ${companyProfile.foundedYear || ''}</span>
      <span>&#128101; Tim: ${companyProfile.teamSize || ''}</span>
      <span>&#9993; ${companyProfile.email || ''}</span>
      <span>&#127760; ${companyProfile.website || ''}</span>
    </div>
  </div>

  <div class="body">
    <div style="display: flex; gap: 10px;">
      ${statsHTML}
    </div>

    <div>
      <div class="section-title">Tentang Perusahaan</div>
      <p style="font-size: 9pt; color: #475569; line-height: 1.7; margin-bottom: 12px;">${companyProfile.description || ''}</p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
          <div style="font-family: 'Outfit', sans-serif; font-size: 9.5pt; font-weight: 800; color: ${accent}; margin-bottom: 4px;">Visi Kami</div>
          <div style="font-size: 8.5pt; color: #475569; line-height: 1.5;">${companyProfile.vision || ''}</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
          <div style="font-family: 'Outfit', sans-serif; font-size: 9.5pt; font-weight: 800; color: #0f172a; margin-bottom: 4px;">Misi Perusahaan</div>
          <ul style="padding-left: 14px;">${missionHTML}</ul>
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <div>
        <div class="section-title">Nilai-Nilai Utama</div>
        ${valuesHTML}
      </div>
      <div>
        <div class="section-title">Perjalanan & Milestone</div>
        ${milestonesHTML}
      </div>
    </div>

    <div>
      <div class="section-title">Tim & Pimpinan Utama</div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
        ${teamHTML}
      </div>
    </div>
  </div>
</div>
    `;

    const container = document.createElement('div');
    container.id = 'company-profile-export-root';
    container.style.position = 'absolute';
    container.style.top = '-99999px';
    container.style.left = '-99999px';
    container.style.width = '210mm';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
      const exportElem = container.querySelector('#comp-export-container') as HTMLElement;
      if (!exportElem) throw new Error('Root container missing');

      const dataUrl = await toJpeg(exportElem, { quality: 0.95, pixelRatio: 2, backgroundColor: '#ffffff' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const imgHeight = (img.height * pdfWidth) / img.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(dataUrl, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(dataUrl, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pdfHeight;
        }

        pdf.save(`Company_Profile_${compName.replace(/\s+/g, '_')}.pdf`);
        document.body.removeChild(container);
        showToast('Profil Perusahaan PDF berhasil didownload!', compName, 'success');
      };
    } catch (err) {
      console.error('Failed to generate Company Profile PDF', err);
      if (document.body.contains(container)) document.body.removeChild(container);
      alert('Gagal mendownload Profil Perusahaan PDF. Silakan coba lagi.');
    }
  };

  /* ── Download PDF CV ── */
  const downloadCV = async () => {
    // Tampilkan notifikasi loading (opsional, jika ada state loading bisa di set di sini)
    
    const skillList = skills.map((s: any) => typeof s === 'string' ? s : s.name).join(', ');
    const expHTML = (biodata?.experiences || []).map((e: any) => `
      <div class="timeline-item">
        <div class="tl-left"><div class="tl-dot"></div><div class="tl-line"></div></div>
        <div class="tl-body">
          <div class="tl-header">
            <div class="tl-title">${e.role}</div>
            <span class="badge">${e.startYear} &mdash; ${e.endYear || 'Sekarang'}</span>
          </div>
          <div class="tl-sub">${e.company}</div>
          ${e.description ? `<div class="tl-desc">${e.description}</div>` : ''}
        </div>
      </div>`).join('');
    const eduHTML = (biodata?.education || []).map((e: any) => `
      <div class="timeline-item">
        <div class="tl-left"><div class="tl-dot"></div><div class="tl-line"></div></div>
        <div class="tl-body">
          <div class="tl-header">
            <div class="tl-title">${e.degree}</div>
            <span class="badge">${e.startYear} &mdash; ${e.endYear || 'Sekarang'}</span>
          </div>
          <div class="tl-sub">${e.institution}</div>
          ${e.description ? `<div class="tl-desc">${e.description}</div>` : ''}
        </div>
      </div>`).join('');
    const orgHTML = (biodata?.organizations || []).map((o: any) => `
      <div class="timeline-item">
        <div class="tl-left"><div class="tl-dot"></div><div class="tl-line"></div></div>
        <div class="tl-body">
          <div class="tl-header">
            <div class="tl-title">${o.role}</div>
            <span class="badge">${o.startYear} &mdash; ${o.endYear || 'Sekarang'}</span>
          </div>
          <div class="tl-sub">${o.name}</div>
          ${o.description ? `<div class="tl-desc">${o.description}</div>` : ''}
        </div>
      </div>`).join('');
    const certHTML = (biodata?.certifications || []).map((c: any) => `
      <div class="cert-item">
        <div class="cert-name">${c.name}</div>
        <div class="cert-meta">${c.issuer} &bull; ${c.year}</div>
      </div>`).join('');
    const langHTML = (biodata?.languages || []).map((l: string) => `<span class="chip">${l}</span>`).join('');

    const htmlContent = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Inter:wght@400;500;600&display=swap');
  
  #cv-export-container * { box-sizing: border-box; margin: 0; padding: 0; }
  
  #cv-export-container {
    font-family: 'Inter', sans-serif;
    color: #1e293b; background: #fff;
    font-size: 10.5pt; line-height: 1.6;
    width: 210mm;
    min-height: 297mm;
    position: relative;
    display: flex; flex-direction: column;
  }

  /* ── Header ── */
  #cv-export-container .cv-header {
    background: linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%);
    padding: 30px 12mm 28px 12mm;
    color: #fff;
    display: flex; align-items: center; gap: 24px;
    position: relative; overflow: hidden;
  }
  #cv-export-container .cv-header::after {
    content: ''; position: absolute; right: -20px; top: -30px;
    width: 150px; height: 150px; border-radius: 50%;
    background: rgba(255,255,255,0.07);
  }
  #cv-export-container .cv-avatar {
    width: 80px; height: 80px; border-radius: 50%;
    border: 3px solid rgba(255,255,255,0.5);
    object-fit: cover; flex-shrink: 0;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
  }
  #cv-export-container .cv-avatar-placeholder {
    width: 80px; height: 80px; border-radius: 50%;
    background: rgba(255,255,255,0.18);
    border: 3px solid rgba(255,255,255,0.4);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Outfit', sans-serif; font-size: 24pt; font-weight: 900;
    color: #fff; flex-shrink: 0; letter-spacing: -1px;
  }
  #cv-export-container .cv-header-info { flex: 1; min-width: 0; overflow: hidden; z-index: 1; }
  #cv-export-container .cv-name { font-family: 'Outfit', sans-serif; font-size: 24pt; font-weight: 900; line-height: 1.05; letter-spacing: -0.5px; margin-bottom: 4px; }
  #cv-export-container .cv-role { font-size: 11pt; font-weight: 600; opacity: 0.95; margin-bottom: 2px; }
  #cv-export-container .cv-company { font-size: 9.5pt; opacity: 0.8; font-style: italic; }
  #cv-export-container .cv-contacts { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
  #cv-export-container .cv-contact-pill {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 8pt; font-weight: 500;
    background: rgba(255,255,255,0.18);
    padding: 4px 10px; border-radius: 100px; color: #fff;
    border: 1px solid rgba(255,255,255,0.25);
  }

  /* ── Body ── */
  #cv-export-container .cv-body {
    display: grid;
    grid-template-columns: 60mm 1fr;
    flex: 1;
  }

  /* ── Sidebar ── */
  #cv-export-container .cv-sidebar {
    background: #f8fafc;
    padding: 24px 14px 24px 12mm;
    border-right: 1px solid #e2e8f0;
  }
  #cv-export-container .sidebar-section { margin-bottom: 22px; }
  #cv-export-container .sidebar-label {
    font-family: 'Outfit', sans-serif; font-size: 8pt; font-weight: 800;
    color: ${accent}; text-transform: uppercase; letter-spacing: 0.12em;
    margin-bottom: 8px; padding-bottom: 4px;
    border-bottom: 1.5px solid ${accent}35;
  }
  #cv-export-container .chip {
    display: inline-block; background: ${accent}12; color: ${accent};
    padding: 3px 8px; border-radius: 100px; font-size: 7.5pt; font-weight: 700; margin: 2px 2px 2px 0; border: 1px solid ${accent}25;
  }
  #cv-export-container .skill-wrap { display: flex; flex-wrap: wrap; }
  #cv-export-container .contact-row {
    display: flex; align-items: flex-start; gap: 6px;
    margin-bottom: 6px; font-size: 8pt; color: #475569; line-height: 1.45;
  }
  #cv-export-container .contact-text {
    flex: 1; min-width: 0; word-break: break-word; overflow-wrap: break-word;
  }
  #cv-export-container .contact-icon { color: ${accent}; flex-shrink: 0; margin-top: 1px; font-size: 9pt; }

  /* ── Main ── */
  #cv-export-container .cv-main { padding: 24px 12mm 24px 20px; }
  #cv-export-container .section { margin-bottom: 22px; }
  #cv-export-container .section-title {
    font-family: 'Outfit', sans-serif; font-size: 11pt; font-weight: 800;
    color: #0f172a; margin-bottom: 10px;
    display: flex; align-items: center; gap: 8px;
  }
  #cv-export-container .section-title::after {
    content: ''; flex: 1; height: 1.5px;
    background: linear-gradient(to right, ${accent}55, transparent); border-radius: 2px;
  }

  /* ── Bio & Timeline ── */
  #cv-export-container .bio-text { font-size: 9.5pt; color: #475569; line-height: 1.7; }
  #cv-export-container .timeline { display: flex; flex-direction: column; }
  #cv-export-container .timeline-item { display: flex; gap: 10px; }
  #cv-export-container .tl-left { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; width: 12px; }
  #cv-export-container .tl-dot {
    width: 9px; height: 9px; border-radius: 50%; background: ${accent}; flex-shrink: 0;
    border: 2px solid #fff; box-shadow: 0 0 0 1.5px ${accent}55; margin-top: 5px;
  }
  #cv-export-container .tl-line { width: 1.5px; flex: 1; background: ${accent}18; margin-top: 4px; min-height: 12px; }
  #cv-export-container .timeline-item:last-child .tl-line { display: none; }
  #cv-export-container .tl-body { flex: 1; padding-bottom: 14px; min-width: 0; }
  #cv-export-container .timeline-item:last-child .tl-body { padding-bottom: 0; }
  #cv-export-container .tl-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 2px; }
  #cv-export-container .tl-title { font-family: 'Outfit', sans-serif; font-size: 10pt; font-weight: 700; color: #0f172a; line-height: 1.3; flex: 1; }
  #cv-export-container .tl-sub { font-size: 8.5pt; color: #64748b; font-weight: 600; margin-bottom: 4px; }
  #cv-export-container .tl-desc { font-size: 8.5pt; color: #64748b; line-height: 1.6; }
  #cv-export-container .badge {
    font-size: 7.5pt; font-weight: 700; color: ${accent}; background: ${accent}12;
    padding: 2px 8px; border-radius: 100px; white-space: nowrap; flex-shrink: 0; border: 1px solid ${accent}22;
  }

  /* ── Certs ── */
  #cv-export-container .certs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  #cv-export-container .cert-item { border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; background: #fafbfc; }
  #cv-export-container .cert-name { font-weight: 700; font-size: 8.5pt; color: #0f172a; margin-bottom: 2px; line-height: 1.3; }
  #cv-export-container .cert-meta { font-size: 8pt; color: #64748b; }
</style>

<!-- Header -->
<div class="cv-header">
  ${avatarUrl
    ? `<img src="${avatarUrl}" alt="${name}" class="cv-avatar" crossorigin="anonymous" />`
    : `<div class="cv-avatar-placeholder">${initials.toUpperCase()}</div>`
  }
  <div class="cv-header-info">
    <div class="cv-name">${name}</div>
    <div class="cv-role">${role}</div>
    ${company ? `<div class="cv-company">@ ${company}</div>` : ''}
    <div class="cv-contacts">
      ${biodata?.email    ? `<span class="cv-contact-pill pdf-link" data-url="mailto:${biodata.email}">&#9993; ${biodata.email}</span>` : ''}
      ${biodata?.phone    ? `<span class="cv-contact-pill pdf-link" data-url="https://wa.me/${biodata.phone.replace(/\D/g, '')}">WA: ${biodata.phone}</span>` : ''}
      ${biodata?.location ? `<span class="cv-contact-pill">&#128205; ${biodata.location}</span>` : ''}
      ${biodata?.website  ? `<span class="cv-contact-pill pdf-link" data-url="${biodata.website.startsWith('http') ? biodata.website : 'https://'+biodata.website}">&#127760; Website</span>` : ''}
    </div>
  </div>
</div>

<!-- Body -->
<div class="cv-body">
  <!-- Sidebar -->
  <div class="cv-sidebar">
    ${skillList ? `
    <div class="sidebar-section">
      <div class="sidebar-label">Keahlian</div>
      <div class="skill-wrap">
        ${skills.map((s: any) => `<span class="chip">${typeof s === 'string' ? s : s.name}</span>`).join('')}
      </div>
    </div>` : ''}

    ${langHTML ? `
    <div class="sidebar-section">
      <div class="sidebar-label">Bahasa</div>
      <div class="skill-wrap">${langHTML}</div>
    </div>` : ''}

    ${biodata?.email ? `
    <div class="sidebar-section">
      <div class="sidebar-label">Kontak</div>
      <div class="contact-row pdf-link" data-url="mailto:${biodata.email}"><span class="contact-icon">&#9993;</span><span class="contact-text">${biodata.email}</span></div>
      ${biodata?.phone ? `<div class="contact-row pdf-link" data-url="https://wa.me/${biodata.phone.replace(/\D/g, '')}"><span class="contact-icon" style="font-size:7pt; font-weight:800; transform:translateY(1px)">WA</span><span class="contact-text">${biodata.phone}</span></div>` : ''}
      ${biodata?.location ? `<div class="contact-row"><span class="contact-icon">&#128205;</span><span class="contact-text">${biodata.location}</span></div>` : ''}
      ${biodata?.website ? `<div class="contact-row pdf-link" data-url="${biodata.website.startsWith('http') ? biodata.website : 'https://'+biodata.website}"><span class="contact-icon">&#127760;</span><span class="contact-text">${biodata.website}</span></div>` : ''}
    </div>` : ''}

    ${(biodata?.socialLinks && Object.keys(biodata.socialLinks).filter((k) => biodata.socialLinks[k]).length > 0) ? `
    <div class="sidebar-section">
      <div class="sidebar-label">Sosial</div>
      ${Object.entries(biodata.socialLinks).filter(([, v]) => v).map(([k, v]) => `<div class="contact-row pdf-link" data-url="${String(v).startsWith('http') ? v : 'https://'+v}"><span class="contact-icon">&#128279;</span><span class="contact-text">${k}</span></div>`).join('')}
    </div>` : ''}
  </div>

  <!-- Main -->
  <div class="cv-main">
    ${bio ? `
    <div class="section">
      <div class="section-title">Profil</div>
      <div class="bio-text">${bio}</div>
    </div>` : ''}

    ${expHTML ? `
    <div class="section">
      <div class="section-title">Pengalaman Kerja</div>
      <div class="timeline">${expHTML}</div>
    </div>` : ''}

    ${eduHTML ? `
    <div class="section">
      <div class="section-title">Pendidikan</div>
      <div class="timeline">${eduHTML}</div>
    </div>` : ''}

    ${orgHTML ? `
    <div class="section">
      <div class="section-title">Organisasi</div>
      <div class="timeline">${orgHTML}</div>
    </div>` : ''}

    ${certHTML ? `
    <div class="section">
      <div class="section-title">Sertifikasi</div>
      <div class="certs-grid">${certHTML}</div>
    </div>` : ''}
  </div>
</div>
`;

    const container = document.createElement('div');
    container.id = 'cv-export-container';
    container.style.position = 'absolute';
    container.style.left = '0px';
    container.style.top = '0px';
    container.style.zIndex = '-9999';
    container.style.width = '210mm';
    container.style.background = '#fff';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    toJpeg(container, { quality: 0.95, skipFonts: false, pixelRatio: 1.5 })
      .then((dataUrl) => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          const imgProps = pdf.getImageProperties(dataUrl);
          const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
          let heightLeft = imgHeight;
          let position = 0;
          
          pdf.addImage(dataUrl, 'JPEG', 0, position, pdfWidth, imgHeight);
          
          // Map DOM links to PDF coordinates
          const containerRect = container.getBoundingClientRect();
          const scaleX = pdfWidth / containerRect.width;
          const scaleY = imgHeight / containerRect.height;
          
          const links = container.querySelectorAll('.pdf-link');
          links.forEach((link: any) => {
            const rect = link.getBoundingClientRect();
            const url = link.getAttribute('data-url');
            if (url) {
              const x = (rect.left - containerRect.left) * scaleX;
              const y = (rect.top - containerRect.top) * scaleY;
              const w = rect.width * scaleX;
              const h = rect.height * scaleY;
              // Make sure the link is on the current page (y coordinate)
              if (y >= position && y < position + pdfHeight) {
                pdf.link(x, y - position, w, h, { url });
              }
            }
          });
          
          heightLeft -= pdfHeight;
          
          while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(dataUrl, 'JPEG', 0, position, pdfWidth, imgHeight);
            
            // Add links for subsequent pages
            links.forEach((link: any) => {
              const rect = link.getBoundingClientRect();
              const url = link.getAttribute('data-url');
              if (url) {
                const x = (rect.left - containerRect.left) * scaleX;
                const y = (rect.top - containerRect.top) * scaleY;
                const w = rect.width * scaleX;
                const h = rect.height * scaleY;
                
                const pageYOffset = imgHeight - heightLeft - pdfHeight; // calculate absolute offset
                if (y >= pageYOffset && y < pageYOffset + pdfHeight) {
                   pdf.link(x, y - pageYOffset, w, h, { url });
                }
              }
            });
            heightLeft -= pdfHeight;
          }
          
          const blob = pdf.output('blob');
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = blobUrl;
          a.download = `CV_${name.replace(/\s+/g, '_')}.pdf`;
          document.body.appendChild(a);
          a.click();
          
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
            document.body.removeChild(container);
          }, 100);
        };
      })
      .catch(err => {
        console.error('Failed to generate PDF', err);
        if (document.body.contains(container)) document.body.removeChild(container);
        alert('Gagal mendownload PDF. Silakan coba lagi.');
      });
  };

  /* ── Sub-components ── */
  const SectionHeading = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: subtitle ? 6 : 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(${accentRgb},0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
          <Icon size={18} strokeWidth={2.2} />
        </div>
        <h2 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: textPri, letterSpacing: '-0.3px' }}>{title}</h2>
      </div>
      {subtitle && <p style={{ margin: '0 0 0 46px', fontFamily: "'Inter',sans-serif", fontSize: 13, color: textSub }}>{subtitle}</p>}
    </div>
  );

  const Card = ({ children, style = {}, hover = true }: { children: React.ReactNode; style?: React.CSSProperties; hover?: boolean }) => (
    <div
      style={{
        background: glass, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${border}`, borderRadius: 20,
        transition: 'all 0.25s ease', ...style
      }}
      onMouseEnter={hover ? (e) => {
        (e.currentTarget as HTMLDivElement).style.background = glassHover;
        (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${accentRgb},0.22)`;
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px rgba(${accentRgb},0.1)`;
      } : undefined}
      onMouseLeave={hover ? (e) => {
        (e.currentTarget as HTMLDivElement).style.background = glass;
        (e.currentTarget as HTMLDivElement).style.borderColor = border;
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      } : undefined}
    >
      {children}
    </div>
  );

  /* Timeline item for experience / education / org */
  const TimelineItem = ({ title, sub, period, desc, isLast = false }: {
    title: string; sub: string; period: string; desc?: string; isLast?: boolean;
  }) => (
    <div style={{ display: 'flex', gap: 18, position: 'relative' }}>
      {/* Dot + line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: accent, border: `3px solid ${bg}`, boxShadow: `0 0 0 3px rgba(${accentRgb},0.25)`, marginTop: 4, flexShrink: 0 }} />
        {!isLast && <div style={{ width: 2, flex: 1, background: `rgba(${accentRgb},0.15)`, marginTop: 6, minHeight: 40 }} />}
      </div>
      {/* Content */}
      <div style={{ paddingBottom: isLast ? 0 : 28, flex: 1 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontSize: 17, fontWeight: 700, color: textPri, lineHeight: 1.3 }}>{title}</h3>
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: accent, background: `rgba(${accentRgb},0.1)`, padding: '3px 10px', borderRadius: 100, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {period}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: desc ? 8 : 0 }}>
          <Building2 size={12} color={textSub} />
          <span style={{ fontSize: 13, fontFamily: "'Inter',sans-serif", color: textSub, fontWeight: 600 }}>{sub}</span>
        </div>
        {desc && <p style={{ margin: 0, fontSize: 13.5, fontFamily: "'Inter',sans-serif", color: textSub, lineHeight: 1.75 }}>{desc}</p>}
      </div>
    </div>
  );

  const hasSocials = biodata?.socialLinks && Object.values(biodata.socialLinks).some(Boolean);
  const hasExperiences = biodata?.experiences?.length > 0;
  const hasEducation = biodata?.education?.length > 0;
  const hasOrgs = biodata?.organizations?.length > 0;
  const hasCerts = biodata?.certifications?.length > 0;
  const hasSkills = skills?.length > 0;
  const hasLanguages = biodata?.languages?.length > 0;

  return (
    <div
      ref={containerRef}
      onScroll={(e) => {
        const st = (e.target as HTMLDivElement).scrollTop;
        window.dispatchEvent(new CustomEvent('page-scroll', { detail: { scrollTop: st } }));
      }}
      style={{
        width: '100%', height: '100dvh', overflowY: 'auto', overflowX: 'hidden',
        background: bg, color: textPri,
        transition: 'background-color 0.3s ease, color 0.3s ease',
        WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain', scrollBehavior: 'smooth',
      }}
    >
      <SEOHelmet title={`Tentang - ${name}`} description={bio || `Profil ${name}, ${role}`} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');

        .about-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          align-items: start;
        }
        .about-sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        @media (min-width: 900px) {
          .about-grid { grid-template-columns: 300px 1fr; gap: 40px; }
          .about-sidebar { position: sticky; top: 90px; }
        }
        @media (min-width: 1200px) {
          .about-grid { grid-template-columns: 320px 1fr; gap: 48px; }
        }

        /* Hero Banner */
        .about-hero-banner {
          position: relative;
          width: 100%;
          min-height: 260px;
          background: linear-gradient(135deg, rgba(${accentRgb},0.85) 0%, rgba(${accentRgb},0.4) 100%);
          border-radius: 28px;
          overflow: hidden;
          margin-bottom: 0;
          display: flex;
          align-items: flex-end;
          padding: 36px 40px;
          box-sizing: border-box;
        }
        @media (max-width: 640px) {
          .about-hero-banner { min-height: 200px; padding: 28px 24px; border-radius: 20px; }
        }

        .hero-blur-orb-1 {
          position: absolute; top: -60px; right: -60px;
          width: 280px; height: 280px; border-radius: 50%;
          background: rgba(255,255,255,0.12); filter: blur(40px);
        }
        .hero-blur-orb-2 {
          position: absolute; bottom: -80px; left: 30%;
          width: 200px; height: 200px; border-radius: 50%;
          background: rgba(255,255,255,0.08); filter: blur(30px);
        }

        .skill-chip {
          display: inline-flex; align-items: center;
          padding: 6px 14px;
          background: ${glass}; border: 1px solid ${border};
          border-radius: 100px; font-family: 'Inter',sans-serif;
          font-size: 12.5px; font-weight: 600; color: ${textPri};
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          transition: all 0.2s ease; cursor: default;
        }
        .skill-chip:hover {
          background: rgba(${accentRgb},0.12);
          border-color: rgba(${accentRgb},0.35);
          color: ${accent};
          transform: translateY(-1px);
        }
        .lang-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 16px;
          background: rgba(${accentRgb},0.08); border: 1px solid rgba(${accentRgb},0.2);
          border-radius: 100px; font-family: 'Inter',sans-serif;
          font-size: 13px; font-weight: 600; color: ${accent};
        }
        .contact-row {
          display: flex; align-items: center; gap: 12; padding: 12px 0;
          border-bottom: 1px solid ${border}; transition: all 0.2s;
        }
        .contact-row:last-child { border-bottom: none; }
        .social-btn {
          display: flex; align-items: center; gap: 10;
          padding: 11px 16px; border-radius: 14px;
          background: ${glass}; border: 1px solid ${border};
          font-family: 'Outfit',sans-serif; font-size: 13px; font-weight: 700;
          color: ${textPri}; text-decoration: none; transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }
        .social-btn:hover {
          background: rgba(${accentRgb},0.1);
          border-color: rgba(${accentRgb},0.3);
          color: ${accent}; transform: translateX(3px);
        }
        .social-icon-badge {
          width: 30px; height: 30px; border-radius: 8px;
          background: rgba(${accentRgb},0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 800; color: ${accent};
          flex-shrink: 0;
        }
        .cert-card {
          background: ${glass}; border: 1px solid ${border}; border-radius: 18px;
          padding: 22px; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          display: flex; flex-direction: column; gap: 12;
          transition: all 0.25s ease;
        }
        .cert-card:hover {
          background: ${glassHover}; border-color: rgba(${accentRgb},0.22);
          transform: translateY(-3px); box-shadow: 0 16px 40px rgba(${accentRgb},0.1);
        }
        .stat-item {
          display: flex; flex-direction: column; align-items: center;
          padding: 16px 12px; flex: 1;
        }
        .stat-value {
          font-family: 'Outfit',sans-serif; font-size: 28px; font-weight: 900;
          color: ${accent}; line-height: 1;
        }
        .stat-label {
          font-family: 'Inter',sans-serif; font-size: 11px; font-weight: 600;
          color: ${textSub}; text-align: center; margin-top: 4px;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .print-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 22px; border-radius: 100px;
          border: 1px solid ${border};
          background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'};
          color: ${textSub}; font-family: 'Outfit',sans-serif;
          font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s ease;
        }
        .print-btn:hover {
        border-color: rgba(${accentRgb},0.4); color: ${accent};
          background: rgba(${accentRgb},0.06);
        }
        @media print {
          #lp-navbar, #lp-footer, .no-print { display: none !important; }
          body, .about-grid { color: #000 !important; background: #fff !important; }
        }
      `}</style>

      <LPNavbar
        items={(data?.navbar?.items || []) as any}
        loginBtnLabel={data?.navbar?.loginBtnLabel || 'Login'}
        logoText={data?.navbar?.logoText}
        isDark={isDark}
        accentColor={accent}
      />

      <main style={{ padding: '104px 20px 80px', maxWidth: 1160, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {isCompanyMode ? (
          /* ════════════════════════ COMPANY PROFILE MODE ════════════════════════ */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
            
            {/* ── COMPANY HERO BANNER ── */}
            <div
              data-reveal="true"
              className="about-hero-banner"
              style={{
                minHeight: 280,
                background: `linear-gradient(135deg, rgba(${accentRgb},0.95) 0%, #1e1b4b 100%)`,
                position: 'relative'
              }}
            >
              <div className="hero-blur-orb-1" />
              <div className="hero-blur-orb-2" />

              <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 780 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)', padding: '5px 14px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.25)', width: 'fit-content' }}>
                  <Building2 size={13} color="#fff" />
                  <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 850, color: '#fff', letterSpacing: '0.08em' }}>
                    {companyProfile.badge || 'PROFIL PERUSAHAAN & STUDIO'}
                  </span>
                </div>

                <h1 style={{ margin: '0', fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 900, letterSpacing: '-1.5px', color: '#ffffff', lineHeight: 1.1 }}>
                  {companyProfile.name || 'sumr.day'}
                </h1>

                <p style={{ margin: 0, fontSize: 16, fontFamily: "'Inter',sans-serif", fontWeight: 500, color: 'rgba(255,255,255,0.92)', lineHeight: 1.5 }}>
                  {companyProfile.tagline || 'A little sunshine for your screen | Creative Digital Studio'}
                </p>
              </div>

              {/* Download Company Profile PDF button */}
              <button
                onClick={downloadCompanyProfile}
                className="print-btn no-print"
                style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', backdropFilter: 'blur(10px)', padding: '9px 20px', borderRadius: 100, fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.28)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)'; }}
              >
                <Download size={14} /> Unduh Profil PDF
              </button>
            </div>

            {/* ── COMPANY STATS METRIC COUNTER ROW ── */}
            <div data-reveal="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              {(companyProfile.stats || [
                { id: 's1', label: 'Karya Terbit', value: '100+' },
                { id: 's2', label: 'Klien Puas', value: '99%' },
                { id: 's3', label: 'Energi Positif', value: '100%' },
                { id: 's4', label: 'Tahun Eksplorasi', value: '3+' }
              ]).map((st: any, idx: number) => (
                <Card key={st.id || idx} style={{ padding: '20px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }} hover={true}>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 32, fontWeight: 900, color: accent, lineHeight: 1 }}>
                    {st.value}
                  </div>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, fontWeight: 700, color: textSub, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>
                    {st.label}
                  </div>
                </Card>
              ))}
            </div>

            {/* ── BENTO GRID: SIDEBAR & MAIN CONTENT ── */}
            <div className="about-grid">
              
              {/* LEFT SIDEBAR: IDENTITY & CONTACT */}
              <div data-reveal="true" className="about-sidebar reveal-delay-1">
                
                {/* Company Info Card */}
                <Card style={{ padding: '26px 22px', display: 'flex', flexDirection: 'column', gap: 16 }} hover={false}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 54, height: 54, borderRadius: 16, background: `rgba(${accentRgb},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0, border: `1.5px solid rgba(${accentRgb},0.3)` }}>
                      <Building2 size={28} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 17, fontWeight: 900, color: textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {companyProfile.name || 'sumr.day'}
                      </div>
                      <div style={{ fontSize: 12.5, color: accent, fontWeight: 700, fontFamily: "'Inter',sans-serif" }}>
                        Creative Digital Studio • Warm Tech
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 11, paddingTop: 14, borderTop: `1px solid ${border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: textSub, fontWeight: 600 }}>Tahun Berdiri:</span>
                      <span style={{ fontWeight: 800, color: textPri }}>{companyProfile.foundedYear || '2022'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: textSub, fontWeight: 600 }}>Ukuran Tim:</span>
                      <span style={{ fontWeight: 800, color: textPri }}>{companyProfile.teamSize || '20+ Spesialis'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: textSub, fontWeight: 600 }}>Kantor Pusat:</span>
                      <span style={{ fontWeight: 800, color: textPri, textAlign: 'right', maxWidth: 150 }}>{companyProfile.headquarters || 'Yogyakarta, Indonesia'}</span>
                    </div>
                  </div>
                </Card>

                {/* Official Contact Info Card */}
                <Card style={{ padding: '22px 22px' }} hover={false}>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12.5, fontWeight: 800, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                    Kontak Resmi
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {companyProfile.headquarters && (
                      <div className="contact-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: `1px solid ${border}` }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: `rgba(${accentRgb},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>
                          <MapPin size={15} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: textSub, textTransform: 'uppercase' }}>Kantor</div>
                          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif", color: textPri }}>{companyProfile.headquarters}</div>
                        </div>
                      </div>
                    )}

                    {companyProfile.email && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '11px 0', borderBottom: `1px solid ${border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: `rgba(${accentRgb},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>
                            <Mail size={15} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: textSub, textTransform: 'uppercase' }}>Email</div>
                            <a href={`mailto:${companyProfile.email}`} style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif", color: textPri, textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {companyProfile.email}
                            </a>
                          </div>
                        </div>
                        <button onClick={() => copy(companyProfile.email, 'Email')} title="Salin" style={{ background: 'none', border: 'none', color: textSub, cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                          <Copy size={13} />
                        </button>
                      </div>
                    )}

                    {companyProfile.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '11px 0', borderBottom: companyProfile.website ? `1px solid ${border}` : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: `rgba(${accentRgb},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>
                            <Phone size={15} />
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: textSub, textTransform: 'uppercase' }}>WhatsApp / Telp</div>
                            <a href={`https://wa.me/${companyProfile.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif", color: textPri, textDecoration: 'none' }}>
                              {companyProfile.phone}
                            </a>
                          </div>
                        </div>
                        <button onClick={() => copy(companyProfile.phone, 'Nomor Telepon')} title="Salin" style={{ background: 'none', border: 'none', color: textSub, cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                          <Copy size={13} />
                        </button>
                      </div>
                    )}

                    {companyProfile.website && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: `rgba(${accentRgb},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>
                          <Globe size={15} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: textSub, textTransform: 'uppercase' }}>Website Resmi</div>
                          <a href={companyProfile.website.startsWith('http') ? companyProfile.website : `https://${companyProfile.website}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif", color: accent, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                            Kunjungi Website <ArrowUpRight size={12} />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Clients & Trusted Partners */}
                {(companyProfile.clients?.length > 0) && (
                  <Card style={{ padding: '22px 22px' }} hover={false}>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12.5, fontWeight: 800, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                      Klien & Mitra Kolaborasi
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {companyProfile.clients.map((cl: any, cIdx: number) => (
                        <div
                          key={cl.id || cIdx}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 10,
                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            border: `1px solid ${border}`,
                            fontFamily: "'Outfit',sans-serif",
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: textPri
                          }}
                        >
                          {cl.name}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

              </div>

              {/* RIGHT MAIN CONTENT AREA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
                
                {/* 1. TENTANG PERUSAHAAN (DESCRIPTION) */}
                <div data-reveal="true" className="reveal-delay-2">
                  <SectionHeading icon={Building2} title="Tentang Studio Kami" subtitle="Visi, identitas, dan komitmen profesional kami" />
                  <Card style={{ padding: '28px 32px' }} hover={false}>
                    <p style={{ margin: 0, fontFamily: "'Inter',sans-serif", fontSize: 15.5, color: textSub, lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                      {companyProfile.description || 'Kami adalah studio digital terintegrasi yang berfokus pada perancangan identitas visual, antarmuka produk modern, dan pengembangan ekosistem web berkinerja tinggi untuk brand global.'}
                    </p>
                  </Card>
                </div>

                {/* 2. VISI & MISI BENTO CARDS */}
                <div data-reveal="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                  <Card style={{ padding: '26px 28px', border: `1.5px solid rgba(${accentRgb},0.35)` }} hover={true}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, color: accent }}>
                      <Sparkles size={20} />
                      <h3 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 900, color: textPri }}>Visi Kami</h3>
                    </div>
                    <p style={{ margin: 0, fontFamily: "'Inter',sans-serif", fontSize: 14, color: textSub, lineHeight: 1.75 }}>
                      {companyProfile.vision || 'Menjadi mitra transformasi visual & digital terdepan yang menghasilkan dampak nyata bagi pertumbuhan bisnis klien di era modern.'}
                    </p>
                  </Card>

                  <Card style={{ padding: '26px 28px' }} hover={true}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, color: '#10b981' }}>
                      <Target size={20} />
                      <h3 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 900, color: textPri }}>Misi Perusahaan</h3>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(companyProfile.mission || [
                        'Menghadirkan standar desain kelas dunia dengan estetika premium dan fungsi intuitif.',
                        'Mengembangkan arsitektur web modern yang cepat, aman, dan mudah dikelola.',
                        'Membangun kolaborasi jangka panjang berasaskan transparansi dan komitmen hasil terbaik.'
                      ]).map((mItem: string, mIdx: number) => (
                        <li key={mIdx} style={{ fontFamily: "'Inter',sans-serif", fontSize: 13.5, color: textSub, lineHeight: 1.6 }}>
                          {mItem}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>

                {/* 3. NILAI-NILAI UTAMA (CORE VALUES) */}
                {(companyProfile.coreValues?.length > 0) && (
                  <div data-reveal="true">
                    <SectionHeading icon={Award} title="Nilai-Nilai Utama (Core Values)" subtitle="Prinsip kerja yang memandu setiap inovasi kami" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                      {companyProfile.coreValues.map((val: any, vIdx: number) => (
                        <Card key={val.id || vIdx} style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 8 }} hover={true}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: `rgba(${accentRgb},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
                              <Sparkles size={16} />
                            </div>
                            <h4 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 800, color: textPri }}>{val.title}</h4>
                          </div>
                          <p style={{ margin: 0, fontFamily: "'Inter',sans-serif", fontSize: 13, color: textSub, lineHeight: 1.65 }}>
                            {val.description}
                          </p>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. TIM & PIMPINAN UTAMA (LEADERSHIP) */}
                {(companyProfile.teamMembers?.length > 0) && (
                  <div data-reveal="true">
                    <SectionHeading icon={Users} title="Tim & Pimpinan Utama" subtitle="Para profesional berdedikasi di balik setiap karya terbaik kami" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
                      {companyProfile.teamMembers.map((tm: any, tIdx: number) => (
                        <Card key={tm.id || tIdx} style={{ padding: '24px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }} hover={true}>
                          <div style={{ width: 76, height: 76, borderRadius: '50%', overflow: 'hidden', background: `rgba(${accentRgb},0.15)`, border: `2.5px solid rgba(${accentRgb},0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 20px rgba(${accentRgb},0.15)` }}>
                            {tm.photo ? (
                              <img src={tm.photo} alt={tm.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Users size={32} color={accent} />
                            )}
                          </div>

                          <div>
                            <h4 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 850, color: textPri }}>
                              {tm.name}
                            </h4>
                            <div style={{ fontSize: 12.5, color: accent, fontWeight: 700, fontFamily: "'Inter',sans-serif", marginTop: 2 }}>
                              {tm.role}
                            </div>
                          </div>

                          {tm.bio && (
                            <p style={{ margin: 0, fontFamily: "'Inter',sans-serif", fontSize: 12.5, color: textSub, lineHeight: 1.55 }}>
                              {tm.bio}
                            </p>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. PERJALANAN & ROADMAP MILESTONES */}
                {(companyProfile.milestones?.length > 0) && (
                  <div data-reveal="true">
                    <SectionHeading icon={Briefcase} title="Perjalanan & Milestone" subtitle="Tonggak sejarah dan pencapaian studio kami dari tahun ke tahun" />
                    <Card style={{ padding: '28px 32px' }} hover={false}>
                      {companyProfile.milestones.map((mil: any, mIdx: number) => (
                        <TimelineItem
                          key={mil.id || mIdx}
                          title={mil.title}
                          sub={`Milestone ${mil.year}`}
                          period={mil.year}
                          desc={mil.description}
                          isLast={mIdx === companyProfile.milestones.length - 1}
                        />
                      ))}
                    </Card>
                  </div>
                )}

                {/* 6. COLLABORATION CTA BANNER */}
                <div
                  data-reveal="true"
                  style={{
                    padding: '36px 32px',
                    borderRadius: 24,
                    background: `linear-gradient(135deg, rgba(${accentRgb},0.2) 0%, rgba(${accentRgb},0.05) 100%)`,
                    border: `1.5px solid rgba(${accentRgb},0.35)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 16
                  }}
                >
                  <h3 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontSize: 24, fontWeight: 900, color: textPri }}>
                    Siap Memulai Proyek Bersama Kami?
                  </h3>
                  <p style={{ margin: 0, fontFamily: "'Inter',sans-serif", fontSize: 14.5, color: textSub, maxWidth: 580, lineHeight: 1.7 }}>
                    Diskusikan kebutuhan identitas visual, website, atau pengembangan produk digital Anda bersama tim ahli kami.
                  </p>
                  <a
                    href={companyProfile.email ? `mailto:${companyProfile.email}` : '#contact'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 28px',
                      borderRadius: 100,
                      background: accent,
                      color: '#ffffff',
                      fontFamily: "'Outfit',sans-serif",
                      fontSize: 14,
                      fontWeight: 800,
                      textDecoration: 'none',
                      boxShadow: `0 8px 24px rgba(${accentRgb},0.35)`,
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
                  >
                    <Mail size={16} /> Hubungi Kami Sekarang
                  </a>
                </div>

              </div>
            </div>

          </div>
        ) : (
          /* ════════════════════════ PERSONAL CV MODE ════════════════════════ */
          <div>
            {/* ── HERO BANNER ── */}
            <div data-reveal="true" className="about-hero-banner" style={{ marginBottom: 40 }}>
              <div className="hero-blur-orb-1" />
              <div className="hero-blur-orb-2" />

              {/* Avatar in hero */}
              {avatarUrl && (
                <div style={{ position: 'absolute', bottom: 0, right: 40, width: 200, height: 200, borderRadius: '50% 50% 0 0', overflow: 'hidden', opacity: 0.18, filter: 'grayscale(20%)' }}>
                  <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
                </div>
              )}

              <div style={{ position: 'relative', zIndex: 2 }}>
                <h1 style={{ margin: '0 0 8px', fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 900, letterSpacing: '-1.5px', color: '#ffffff', lineHeight: 1.05 }}>
                  {name}
                </h1>
                <div style={{ fontSize: 16, fontFamily: "'Inter',sans-serif", fontWeight: 500, color: 'rgba(255,255,255,0.82)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {role}
                  {company && (
                    <>
                      <ChevronRight size={14} style={{ opacity: 0.6 }} />
                      <span style={{ opacity: 0.75 }}>{company}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Download CV button */}
              <button
                onClick={downloadCV}
                className="print-btn no-print"
                style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', backdropFilter: 'blur(10px)', padding: '8px 18px', borderRadius: 100, fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)'; }}
              >
                <Download size={14} /> Download PDF
              </button>
            </div>

            {/* ── MAIN GRID ── */}
            <div className="about-grid">

              {/* ═══ LEFT SIDEBAR ═══ */}
              <div data-reveal="true" className="about-sidebar reveal-delay-1">

                {/* Profile Card */}
                <Card style={{ padding: '28px 24px', textAlign: 'center' }} hover={false}>
                  {/* Avatar */}
                  {avatarUrl ? (
                    <div style={{ width: 110, height: 110, borderRadius: '50%', overflow: 'hidden', border: `3px solid rgba(${accentRgb},0.25)`, margin: '0 auto 16px', boxShadow: `0 8px 28px rgba(${accentRgb},0.2)` }}>
                      <img src={avatarUrl} alt={name} loading="eager" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: 110, height: 110, borderRadius: '50%', background: `linear-gradient(135deg, rgba(${accentRgb},0.7), rgba(${accentRgb},0.3))`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff', fontFamily: "'Outfit',sans-serif", fontSize: 34, fontWeight: 900, letterSpacing: -2, boxShadow: `0 8px 28px rgba(${accentRgb},0.3)` }}>
                      {initials.toUpperCase()}
                    </div>
                  )}
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 17, fontWeight: 800, color: textPri, marginBottom: 4, letterSpacing: '-0.3px' }}>{name}</div>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600, color: accent, marginBottom: company ? 4 : 0 }}>{role}</div>
                  {company && <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: textSub }}>@ {company}</div>}

                  {/* Stats row */}
                  {(hasExperiences || hasCerts || hasSkills) && (
                    <div style={{ display: 'flex', marginTop: 20, borderTop: `1px solid ${border}`, paddingTop: 4 }}>
                      {hasExperiences && (
                        <div className="stat-item" style={{ borderRight: `1px solid ${border}` }}>
                          <div className="stat-value">{biodata?.experiences?.length}</div>
                          <div className="stat-label">Pengalaman</div>
                        </div>
                      )}
                      {hasSkills && (
                        <div className="stat-item" style={hasExperiences && hasCerts ? { borderRight: `1px solid ${border}` } : {}}>
                          <div className="stat-value">{skills.length}</div>
                          <div className="stat-label">Keahlian</div>
                        </div>
                      )}
                      {hasCerts && (
                        <div className="stat-item">
                          <div className="stat-value">{biodata?.certifications?.length}</div>
                          <div className="stat-label">Sertifikat</div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* Contact Card */}
                {(biodata?.location || biodata?.email || biodata?.phone || biodata?.website) && (
                  <Card style={{ padding: '20px 22px' }} hover={false}>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 800, color: textSub, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Kontak</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {biodata?.location && (
                        <div className="contact-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: `1px solid ${border}` }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: `rgba(${accentRgb},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>
                            <MapPin size={15} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: textSub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lokasi</div>
                            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif", color: textPri, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{biodata.location}</div>
                          </div>
                        </div>
                      )}
                      {biodata?.email && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '11px 0', borderBottom: `1px solid ${border}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: `rgba(${accentRgb},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>
                              <Mail size={15} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: textSub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</div>
                              <a href={`mailto:${biodata.email}`} style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif", color: textPri, textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{biodata.email}</a>
                            </div>
                          </div>
                          <button onClick={() => copy(biodata.email, 'Email')} title="Salin" style={{ background: 'none', border: 'none', color: textSub, cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                            <Copy size={13} />
                          </button>
                        </div>
                      )}
                      {biodata?.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '11px 0', borderBottom: biodata?.website ? `1px solid ${border}` : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: `rgba(${accentRgb},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>
                              <Phone size={15} />
                            </div>
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: textSub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Telepon</div>
                              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif", color: textPri }}>{biodata.phone}</div>
                            </div>
                          </div>
                          <button onClick={() => copy(biodata.phone, 'Nomor HP')} title="Salin" style={{ background: 'none', border: 'none', color: textSub, cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                            <Copy size={13} />
                          </button>
                        </div>
                      )}
                      {biodata?.website && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0' }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: `rgba(${accentRgb},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>
                            <Globe size={15} />
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: textSub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Website</div>
                            <a href={biodata.website} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif", color: accent, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                              Kunjungi <ArrowUpRight size={12} />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Social Links */}
                {hasSocials && (
                  <Card style={{ padding: '20px 22px' }} hover={false}>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 800, color: textSub, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Sosial Media</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(biodata.socialLinks).map(([platform, url]: any) => {
                        if (!url) return null;
                        const icon = SOCIAL_ICONS[platform.toLowerCase()] || platform.substring(0, 2).toUpperCase();
                        return (
                          <a key={platform} href={url} target="_blank" rel="noreferrer" className="social-btn">
                            <div className="social-icon-badge">{icon}</div>
                            <span style={{ flex: 1, textTransform: 'capitalize' }}>{platform}</span>
                            <ArrowUpRight size={13} style={{ opacity: 0.5 }} />
                          </a>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* Languages */}
                {hasLanguages && (
                  <Card style={{ padding: '20px 22px' }} hover={false}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <Languages size={15} color={accent} />
                      <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 800, color: textSub, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Bahasa</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {biodata.languages.map((lang: string) => (
                        <span key={lang} className="lang-chip">{lang}</span>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              {/* ═══ RIGHT COLUMN ═══ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>

                {/* Bio */}
                {bio && (
                  <div data-reveal="true" className="reveal-delay-2">
                    <SectionHeading icon={Users} title="Profil Singkat" subtitle="Siapa saya dan apa yang saya kerjakan" />
                    <Card style={{ padding: '28px 32px' }} hover={false}>
                      <p style={{ margin: 0, fontFamily: "'Inter',sans-serif", fontSize: 15.5, color: textSub, lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                        {bio}
                      </p>
                    </Card>
                  </div>
                )}

                {/* Skills */}
                {hasSkills && (
                  <div data-reveal="true" className="reveal-delay-3">
                    <SectionHeading icon={Code2} title="Keahlian & Teknologi" subtitle="Tools dan teknologi yang saya kuasai" />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {skills.map((skill: any) => {
                        const skillName = typeof skill === 'string' ? skill : skill.name;
                        return <span key={skillName} className="skill-chip">{skillName}</span>;
                      })}
                    </div>
                  </div>
                )}

                {/* Experiences */}
                {hasExperiences && (
                  <div data-reveal="true">
                    <SectionHeading icon={Briefcase} title="Pengalaman Kerja" subtitle={`${biodata.experiences.length} posisi yang pernah dijalani`} />
                    <Card style={{ padding: '28px 32px' }} hover={false}>
                      {biodata.experiences.map((exp: any, i: number) => (
                        <TimelineItem
                          key={i}
                          title={exp.role}
                          sub={exp.company}
                          period={`${exp.startYear} — ${exp.endYear || 'Sekarang'}`}
                          desc={exp.description}
                          isLast={i === biodata.experiences.length - 1}
                        />
                      ))}
                    </Card>
                  </div>
                )}

                {/* Education */}
                {hasEducation && (
                  <div data-reveal="true">
                    <SectionHeading icon={GraduationCap} title="Pendidikan" subtitle="Riwayat pendidikan formal" />
                    <Card style={{ padding: '28px 32px' }} hover={false}>
                      {biodata.education.map((edu: any, i: number) => (
                        <TimelineItem
                          key={i}
                          title={edu.degree}
                          sub={edu.institution}
                          period={`${edu.startYear} — ${edu.endYear || 'Sekarang'}`}
                          desc={edu.description}
                          isLast={i === biodata.education.length - 1}
                        />
                      ))}
                    </Card>
                  </div>
                )}

                {/* Organizations */}
                {hasOrgs && (
                  <div data-reveal="true">
                    <SectionHeading icon={Users} title="Organisasi & Komunitas" />
                    <Card style={{ padding: '28px 32px' }} hover={false}>
                      {biodata.organizations.map((org: any, i: number) => (
                        <TimelineItem
                          key={i}
                          title={org.role}
                          sub={org.name}
                          period={`${org.startYear} — ${org.endYear || 'Sekarang'}`}
                          desc={org.description}
                          isLast={i === biodata.organizations.length - 1}
                        />
                      ))}
                    </Card>
                  </div>
                )}

                {/* Certifications */}
                {hasCerts && (
                  <div data-reveal="true">
                    <SectionHeading icon={Award} title="Sertifikasi & Lisensi" subtitle={`${biodata.certifications.length} sertifikat diperoleh`} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                      {biodata.certifications.map((cert: any, i: number) => (
                        <div key={i} className="cert-card">
                          {/* Issuer badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(${accentRgb},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>
                              <Award size={16} />
                            </div>
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: textSub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Penerbit</div>
                              <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Inter',sans-serif", color: textPri }}>{cert.issuer}</div>
                            </div>
                            <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: "'Outfit',sans-serif", fontWeight: 700, color: accent, background: `rgba(${accentRgb},0.1)`, padding: '3px 9px', borderRadius: 100 }}>
                              <CalendarDays size={10} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
                              {cert.year}
                            </span>
                          </div>
                          <h4 style={{ margin: 0, fontSize: 15, fontFamily: "'Outfit',sans-serif", fontWeight: 700, color: textPri, lineHeight: 1.4 }}>{cert.name}</h4>
                          {cert.credentialUrl && (
                            <a
                              href={cert.credentialUrl} target="_blank" rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: accent, textDecoration: 'none', fontFamily: "'Outfit',sans-serif", padding: '7px 14px', background: `rgba(${accentRgb},0.1)`, borderRadius: 100, alignSelf: 'flex-start', transition: 'background 0.2s ease' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = `rgba(${accentRgb},0.2)`)}
                              onMouseLeave={(e) => (e.currentTarget.style.background = `rgba(${accentRgb},0.1)`)}
                            >
                              Lihat Kredensial <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </main>

      <LPFooter isDark={isDark} accentColor={accent} data={data?.footer} />
    </div>
  );
};

export default AboutPage;
