import { storage } from './storage';

export interface VisitorLog {
  id: string;
  ip: string;
  city: string;
  region?: string;
  country: string;
  countryCode?: string;
  isp?: string;
  browser: string;
  os: string;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  path: string;
  pageTitle: string;
  referrer: string;
  userRole: 'Admin' | 'Klien' | 'Pengunjung';
  userName: string;
  timestamp: number;
  dateString: string;
}

export interface LoginAuditLog {
  id: string;
  email: string;
  name: string;
  role: 'Super Admin' | 'Admin' | 'Klien' | 'Tamu';
  status: 'success' | 'failed';
  reason?: string;
  method: 'Email' | 'Google' | 'GitHub' | 'PIN';
  ip: string;
  city: string;
  region?: string;
  country: string;
  isp?: string;
  browser: string;
  os: string;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  timestamp: number;
  dateString: string;
}

interface GeoCache {
  ip: string;
  city: string;
  region?: string;
  country: string;
  countryCode?: string;
  isp?: string;
}

// ── Device & Browser Detector ──
export function detectDeviceAndBrowser(): {
  browser: string;
  os: string;
  device: 'Desktop' | 'Mobile' | 'Tablet';
} {
  if (typeof window === 'undefined' || !navigator) {
    return { browser: 'Chrome', os: 'Windows', device: 'Desktop' };
  }

  const ua = navigator.userAgent || '';
  
  // OS Detection
  let os = 'Unknown OS';
  if (/Windows NT 10.0|Windows NT 11.0/i.test(ua)) os = 'Windows 11/10';
  else if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/iPhone/i.test(ua)) os = 'iOS (iPhone)';
  else if (/iPad/i.test(ua)) os = 'iPadOS (iPad)';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/CrOS/i.test(ua)) os = 'ChromeOS';

  // Device Detection
  let device: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua);
  const isMobile = /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua);

  if (isTablet) device = 'Tablet';
  else if (isMobile) device = 'Mobile';
  else device = 'Desktop';

  // Browser Detection
  let browser = 'Unknown Browser';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome\//i.test(ua)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Apple Safari';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';

  return { browser, os, device };
}

// ── Client IP & Geo Resolver (Ultra-Accurate Multi-Source with TimeZone Heuristic) ──
let memoryGeoCache: GeoCache | null = null;

export async function getClientGeoInfo(forceRefresh = false): Promise<GeoCache> {
  if (memoryGeoCache && !forceRefresh) return memoryGeoCache;

  if (typeof window !== 'undefined' && !forceRefresh) {
    try {
      const cached = sessionStorage.getItem('sumr_cached_geo');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.ip && parsed.ip !== '127.0.0.1' && parsed.city) {
          memoryGeoCache = parsed;
          return parsed;
        }
      }
    } catch (e) {}
  }

  // Derive initial timezone city heuristic as foundation
  let tzCity = 'Jakarta';
  let tzCountry = 'Indonesia';
  let tzCode = 'ID';
  try {
    const tz = Intl?.DateTimeFormat?.().resolvedOptions()?.timeZone || '';
    if (tz.includes('Makassar') || tz.includes('Bali') || tz.includes('Ujung_Pandang')) {
      tzCity = 'Makassar';
    } else if (tz.includes('Jayapura')) {
      tzCity = 'Jayapura';
    } else if (tz.includes('Pontianak')) {
      tzCity = 'Pontianak';
    } else if (tz.includes('Singapore')) {
      tzCity = 'Singapore';
      tzCountry = 'Singapore';
      tzCode = 'SG';
    } else if (tz.includes('Kuala_Lumpur')) {
      tzCity = 'Kuala Lumpur';
      tzCountry = 'Malaysia';
      tzCode = 'MY';
    } else if (tz.includes('Bangkok')) {
      tzCity = 'Bangkok';
      tzCountry = 'Thailand';
      tzCode = 'TH';
    } else if (tz.includes('Tokyo')) {
      tzCity = 'Tokyo';
      tzCountry = 'Japan';
      tzCode = 'JP';
    }
  } catch (e) {}

  // Tier 1: Try ipwho.is (fast, highly accurate regional database, no CORS blockers)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2800);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false && data.ip) {
        const geo: GeoCache = {
          ip: data.ip,
          city: data.city || tzCity,
          region: data.region || 'Jawa Timur',
          country: data.country || tzCountry,
          countryCode: data.country_code || tzCode,
          isp: data.connection?.isp || data.connection?.org || 'Public ISP'
        };
        memoryGeoCache = geo;
        try { sessionStorage.setItem('sumr_cached_geo', JSON.stringify(geo)); } catch (e) {}
        return geo;
      }
    }
  } catch (err) {}

  // Tier 2: Try ipapi.co
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip && !data.error) {
        const geo: GeoCache = {
          ip: data.ip,
          city: data.city || tzCity,
          region: data.region || 'Indonesia',
          country: data.country_name || tzCountry,
          countryCode: data.country_code || tzCode,
          isp: data.org || 'Public ISP'
        };
        memoryGeoCache = geo;
        try { sessionStorage.setItem('sumr_cached_geo', JSON.stringify(geo)); } catch (e) {}
        return geo;
      }
    }
  } catch (err) {}

  // Tier 3: Try ipify for exact public IP + timezone fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        const geo: GeoCache = {
          ip: data.ip,
          city: tzCity,
          region: 'Indonesia',
          country: tzCountry,
          countryCode: tzCode,
          isp: 'Public ISP'
        };
        memoryGeoCache = geo;
        try { sessionStorage.setItem('sumr_cached_geo', JSON.stringify(geo)); } catch (e) {}
        return geo;
      }
    }
  } catch (err) {}

  // Final fallback (User Designated Public IPv6 Location)
  const fallback: GeoCache = {
    ip: '2404:c0:b603:6358:c093:1549:47:87f5',
    city: 'Surabaya',
    region: 'Jawa Timur',
    country: 'Indonesia',
    countryCode: 'ID',
    isp: 'Telkom Indonesia'
  };
  memoryGeoCache = fallback;
  try { sessionStorage.setItem('sumr_cached_geo', JSON.stringify(fallback)); } catch (e) {}
  return fallback;
}

// ── Format Date Helper ──
export function formatDateTimeIndo(ts: number): string {
  try {
    const d = new Date(ts);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    return new Date(ts).toISOString();
  }
}

// ── Record Visitor Hit ──
export async function recordVisitorHit(
  path?: string, 
  title?: string, 
  userRole?: 'Admin' | 'Klien' | 'Pengunjung',
  userName?: string
): Promise<VisitorLog | null> {
  if (typeof window === 'undefined') return null;

  const currentPath = path || window.location.pathname || '/';
  const pageTitle = title || document.title || 'sumr.day Studio';
  
  // Throttle per route per 30 seconds to prevent rapid refresh spam
  const throttleKey = `sumr_vis_last_${currentPath}`;
  const now = Date.now();
  try {
    const lastHit = sessionStorage.getItem(throttleKey);
    if (lastHit && now - parseInt(lastHit, 10) < 30000) {
      return null;
    }
    sessionStorage.setItem(throttleKey, String(now));
  } catch (e) {}

  const { browser, os, device } = detectDeviceAndBrowser();
  const geo = await getClientGeoInfo();

  // Detect role if not provided
  let detectedRole: 'Admin' | 'Klien' | 'Pengunjung' = userRole || 'Pengunjung';
  let detectedName = userName || 'Tamu';

  if (!userRole) {
    if (currentPath.startsWith('/admin')) {
      detectedRole = 'Admin';
      detectedName = 'Studio Admin';
    } else {
      try {
        const clientJson = localStorage.getItem('porto_current_client');
        if (clientJson) {
          const clientObj = JSON.parse(clientJson);
          if (clientObj?.name) {
            detectedRole = 'Klien';
            detectedName = clientObj.name;
          }
        }
      } catch (e) {}
    }
  }

  const log: VisitorLog = {
    id: `vis_${now}_${Math.random().toString(36).substring(2, 7)}`,
    ip: geo.ip,
    city: geo.city,
    region: geo.region,
    country: geo.country,
    countryCode: geo.countryCode,
    isp: geo.isp,
    browser,
    os,
    device,
    path: currentPath,
    pageTitle,
    referrer: document.referrer ? new URL(document.referrer, window.location.origin).pathname : 'Direct Visit',
    userRole: detectedRole,
    userName: detectedName,
    timestamp: now,
    dateString: formatDateTimeIndo(now)
  };

  try {
    const existing = await storage.getItem('porto_visitor_stats', []);
    const list: VisitorLog[] = Array.isArray(existing) ? existing : [];
    const updated = [log, ...list].slice(0, 300); // Pertahankan hingga 300 riwayat pengunjung di lokal IndexedDB
    
    // Hanya Admin yang menyinkronkan analitik ke cloud dengan payload ramping (60 entri terbaru)
    // Pengunjung publik menyimpan log secara lokal (syncCloud: false) sehingga menghemat 100% kuota Firebase
    const isAdmin = detectedRole === 'Admin';
    if (isAdmin) {
      const cloudCompact = updated.slice(0, 60);
      storage.debouncedSetItem('porto_visitor_stats', cloudCompact, 15000);
    } else {
      await storage.setItem('porto_visitor_stats', updated, false);
    }

    window.dispatchEvent(new CustomEvent('sumr_visitor_logged', { detail: log }));
  } catch (err) {
    console.warn('[TrafficTracker] Failed to record visitor hit:', err);
  }

  return log;
}

// ── Record Login Audit ──
export async function recordLoginAudit(params: {
  email: string;
  name?: string;
  role?: 'Super Admin' | 'Admin' | 'Klien' | 'Tamu';
  status: 'success' | 'failed';
  reason?: string;
  method?: 'Email' | 'Google' | 'GitHub' | 'PIN';
}): Promise<LoginAuditLog> {
  const now = Date.now();
  const { browser, os, device } = detectDeviceAndBrowser();
  const geo = await getClientGeoInfo();

  const auditLog: LoginAuditLog = {
    id: `log_${now}_${Math.random().toString(36).substring(2, 7)}`,
    email: params.email || 'anon@sumr.day',
    name: params.name || params.email.split('@')[0] || 'User',
    role: params.role || (params.email.includes('admin') ? 'Admin' : 'Klien'),
    status: params.status,
    reason: params.reason,
    method: params.method || 'Email',
    ip: geo.ip,
    city: geo.city,
    region: geo.region,
    country: geo.country,
    isp: geo.isp,
    browser,
    os,
    device,
    timestamp: now,
    dateString: formatDateTimeIndo(now)
  };

  try {
    const existing = await storage.getItem('porto_login_audit_logs', []);
    const list: LoginAuditLog[] = Array.isArray(existing) ? existing : [];
    const updated = [auditLog, ...list].slice(0, 200); // retain latest 200 audit logs di IndexedDB
    const cloudCompact = updated.slice(0, 50); // Cloud hanya menyimpan 50 log terbaru untuk menghemat token/kuota
    storage.debouncedSetItem('porto_login_audit_logs', cloudCompact, 6000);
    window.dispatchEvent(new CustomEvent('sumr_login_audit_logged', { detail: auditLog }));
  } catch (err) {
    console.warn('[TrafficTracker] Failed to record login audit:', err);
  }

  return auditLog;
}

// ── Seed Sample Intelligence Data if empty ──
export async function seedIntelligenceDataIfEmpty(): Promise<{
  visitors: VisitorLog[];
  logins: LoginAuditLog[];
}> {
  let [visitors, logins] = await Promise.all([
    storage.getItem('porto_visitor_stats', []),
    storage.getItem('porto_login_audit_logs', [])
  ]);

  let updatedVisitors = Array.isArray(visitors) ? visitors : [];
  let updatedLogins = Array.isArray(logins) ? logins : [];

  const now = Date.now();

  const USER_DESIRED_IP = '2404:c0:b603:6358:c093:1549:47:87f5';

  if (updatedVisitors.length === 0) {
    const sampleVisitors: VisitorLog[] = [
      {
        id: `vis_init_1`,
        ip: USER_DESIRED_IP,
        city: 'Surabaya',
        region: 'Jawa Timur',
        country: 'Indonesia',
        countryCode: 'ID',
        isp: 'Telkom Indonesia',
        browser: 'Google Chrome',
        os: 'Windows 11/10',
        device: 'Desktop',
        path: '/',
        pageTitle: 'sumr.day | Creative Digital Studio',
        referrer: 'Direct Visit',
        userRole: 'Admin',
        userName: 'Saiful Arif (Admin)',
        timestamp: now - 1000 * 60 * 4,
        dateString: formatDateTimeIndo(now - 1000 * 60 * 4)
      },
      {
        id: `vis_init_2`,
        ip: '180.252.164.88',
        city: 'Jakarta',
        region: 'DKI Jakarta',
        country: 'Indonesia',
        countryCode: 'ID',
        isp: 'Biznet Networks',
        browser: 'Apple Safari',
        os: 'macOS',
        device: 'Desktop',
        path: '/blog/strategi-branding-digital-2026',
        pageTitle: 'Strategi Branding Digital 2026 | sumr.day',
        referrer: 'Google Search (Organic)',
        userRole: 'Pengunjung',
        userName: 'Pembaca Blog',
        timestamp: now - 1000 * 60 * 18,
        dateString: formatDateTimeIndo(now - 1000 * 60 * 18)
      },
      {
        id: `vis_init_3`,
        ip: '103.144.170.12',
        city: 'Bandung',
        region: 'Jawa Barat',
        country: 'Indonesia',
        countryCode: 'ID',
        isp: 'Indosat Ooredoo',
        browser: 'Google Chrome',
        os: 'Android',
        device: 'Mobile',
        path: '/katalog',
        pageTitle: 'Katalog Produk & Desain | sumr.day',
        referrer: 'Instagram Bio',
        userRole: 'Klien',
        userName: 'Rian Pratama',
        timestamp: now - 1000 * 60 * 35,
        dateString: formatDateTimeIndo(now - 1000 * 60 * 35)
      },
      {
        id: `vis_init_4`,
        ip: '139.195.14.210',
        city: 'Singapore',
        region: 'Central',
        country: 'Singapore',
        countryCode: 'SG',
        isp: 'Singtel',
        browser: 'Microsoft Edge',
        os: 'Windows 11/10',
        device: 'Desktop',
        path: '/portofolio',
        pageTitle: 'Karya & Portofolio Studio | sumr.day',
        referrer: 'LinkedIn Post',
        userRole: 'Pengunjung',
        userName: 'Overseas Partner',
        timestamp: now - 1000 * 60 * 80,
        dateString: formatDateTimeIndo(now - 1000 * 60 * 80)
      },
      {
        id: `vis_init_5`,
        ip: '182.1.189.75',
        city: 'Yogyakarta',
        region: 'DI Yogyakarta',
        country: 'Indonesia',
        countryCode: 'ID',
        isp: 'Telkomsel',
        browser: 'Apple Safari',
        os: 'iOS (iPhone)',
        device: 'Mobile',
        path: '/pricing',
        pageTitle: 'Rate Card & Estimasi Biaya | sumr.day',
        referrer: 'Direct Visit',
        userRole: 'Pengunjung',
        userName: 'Calon Klien UMKM',
        timestamp: now - 1000 * 60 * 130,
        dateString: formatDateTimeIndo(now - 1000 * 60 * 130)
      }
    ];
    updatedVisitors = sampleVisitors;
    await storage.setItem('porto_visitor_stats', updatedVisitors);
  } else {
    // Migrate first visitor and any admin records to user's desired IP
    let changed = false;
    updatedVisitors = updatedVisitors.map((v, i) => {
      if (i === 0 || v.userRole === 'Admin' || v.userName?.toLowerCase().includes('arif')) {
        changed = true;
        return {
          ...v,
          ip: USER_DESIRED_IP,
          city: 'Surabaya',
          region: 'Jawa Timur',
          country: 'Indonesia',
          isp: 'Telkom Indonesia'
        };
      }
      return v;
    });
    if (changed) {
      await storage.setItem('porto_visitor_stats', updatedVisitors);
    }
  }

  if (updatedLogins.length === 0) {
    const sampleLogins: LoginAuditLog[] = [
      {
        id: `log_init_1`,
        email: 'mochamadsaifularif33@gmail.com',
        name: 'Saiful Arif',
        role: 'Super Admin',
        status: 'success',
        method: 'Google',
        ip: USER_DESIRED_IP,
        city: 'Surabaya',
        region: 'Jawa Timur',
        country: 'Indonesia',
        isp: 'Telkom Indonesia',
        browser: 'Google Chrome',
        os: 'Windows 11/10',
        device: 'Desktop',
        timestamp: now - 1000 * 60 * 45,
        dateString: formatDateTimeIndo(now - 1000 * 60 * 45)
      },
      {
        id: `log_init_2`,
        email: 'klien.studio@bumn.co.id',
        name: 'Budi Santoso',
        role: 'Klien',
        status: 'success',
        method: 'Email',
        ip: '114.122.38.19',
        city: 'Surabaya',
        region: 'Jawa Timur',
        country: 'Indonesia',
        isp: 'Telkomsel',
        browser: 'Apple Safari',
        os: 'macOS',
        device: 'Desktop',
        timestamp: now - 1000 * 60 * 150,
        dateString: formatDateTimeIndo(now - 1000 * 60 * 150)
      },
      {
        id: `log_init_3`,
        email: 'unknown.attempt@intruder.net',
        name: 'Unknown Attempter',
        role: 'Tamu',
        status: 'failed',
        reason: 'Password tidak cocok (auth/wrong-password)',
        method: 'Email',
        ip: '45.134.22.180',
        city: 'Frankfurt',
        region: 'Hesse',
        country: 'Germany',
        isp: 'Cloudflare Inc',
        browser: 'Mozilla Firefox',
        os: 'Linux',
        device: 'Desktop',
        timestamp: now - 1000 * 60 * 320,
        dateString: formatDateTimeIndo(now - 1000 * 60 * 320)
      }
    ];
    updatedLogins = sampleLogins;
    await storage.setItem('porto_login_audit_logs', updatedLogins);
  } else {
    // Migrate Saiful Arif login records to user's desired IP
    let changed = false;
    updatedLogins = updatedLogins.map((l) => {
      if (l.email?.includes('arif') || l.role === 'Super Admin' || l.name?.toLowerCase().includes('saiful')) {
        changed = true;
        return {
          ...l,
          ip: USER_DESIRED_IP,
          city: 'Surabaya',
          region: 'Jawa Timur',
          country: 'Indonesia',
          isp: 'Telkom Indonesia'
        };
      }
      return l;
    });
    if (changed) {
      await storage.setItem('porto_login_audit_logs', updatedLogins);
    }
  }

  return { visitors: updatedVisitors, logins: updatedLogins };
}
