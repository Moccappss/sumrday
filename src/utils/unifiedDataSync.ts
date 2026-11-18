import { storage } from './storage';
import { BusinessProfile, BankAccount, DEFAULT_BUSINESS_PROFILE } from '../types/businessProfile';

export const BUSINESS_PROFILE_STORAGE_KEY = 'porto_business_profile';

/**
 * Format any Indonesian phone number to international WhatsApp format:
 * e.g. "0812-3456-7890" -> "6281234567890"
 */
export const formatWhatsAppNumber = (phoneStr?: string): string => {
  if (!phoneStr) return '';
  let cleaned = phoneStr.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

/**
 * Normalize bank account format across BusinessProfile, ShopSettings, and InvoiceSettings
 */
export const normalizeBankAccount = (bank: any, fallbackHolder: string = 'ARIF DARMAWAN'): BankAccount & { name?: string; accountHolder?: string; logo?: string } => {
  const bName = bank.bankName || bank.name || 'BCA';
  const aNumber = (bank.accountNumber || '').trim();
  const aHolder = (bank.accountName || bank.accountHolder || fallbackHolder).trim();
  const logo = bank.bankLogo || bank.logo || '';
  const color = bank.color || '#003399';

  return {
    id: bank.id || `bank_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    bankName: bName,
    name: bName,
    accountNumber: aNumber,
    accountName: aHolder,
    accountHolder: aHolder,
    bankLogo: logo,
    logo: logo,
    color: color
  };
};

/**
 * Detect what fields have changed between old and new state
 */
export interface DetectedChanges {
  labels: string[];
  details: string[];
  hasChanges: boolean;
}

export const detectStudioFieldChanges = (
  oldData: Partial<BusinessProfile>,
  newData: Partial<BusinessProfile>
): DetectedChanges => {
  const labels: string[] = [];
  const details: string[] = [];

  // 1. WhatsApp / Telepon
  if (newData.whatsapp !== undefined && newData.whatsapp !== oldData.whatsapp) {
    labels.push('Nomor WhatsApp');
    details.push(`WhatsApp: ${oldData.whatsapp || '-'} → ${newData.whatsapp}`);
  }
  if (newData.whatsappAlt !== undefined && newData.whatsappAlt !== oldData.whatsappAlt) {
    labels.push('WhatsApp Cadangan');
  }

  // 2. Nama Brand / Usaha
  if (newData.brandName !== undefined && newData.brandName !== oldData.brandName) {
    labels.push('Nama Usaha / Studio');
    details.push(`Nama Studio: "${oldData.brandName || '-'}" → "${newData.brandName}"`);
  }

  // 3. Email
  if (newData.email !== undefined && newData.email !== oldData.email) {
    labels.push('Email Resmi');
    details.push(`Email: ${oldData.email || '-'} → ${newData.email}`);
  }

  // 4. Alamat / Lokasi
  if (newData.address !== undefined && newData.address !== oldData.address) {
    labels.push('Alamat Studio');
    details.push(`Alamat: ${newData.address}`);
  }
  if (newData.city !== undefined && newData.city !== oldData.city) {
    labels.push('Kota / Wilayah');
  }

  // 5. Rekening Bank
  if (newData.bankAccounts !== undefined) {
    const oldBanks = oldData.bankAccounts || [];
    const newBanks = newData.bankAccounts || [];
    const oldStr = JSON.stringify(oldBanks.map(b => ({ n: b.bankName, no: b.accountNumber, h: b.accountName })));
    const newStr = JSON.stringify(newBanks.map(b => ({ n: b.bankName, no: b.accountNumber, h: b.accountName })));
    if (oldStr !== newStr) {
      const bankNames = Array.from(new Set(newBanks.map(b => b.bankName).filter(Boolean))).join(', ');
      labels.push(`Rekening Bank (${bankNames || 'Metode Pembayaran'})`);
      details.push(`Rekening: ${newBanks.length} akun aktif (${bankNames || 'Tersimpan'})`);
    }
  }

  // 6. QRIS
  if (newData.qris !== undefined) {
    const oldQrisUrl = oldData.qris?.imageUrl || '';
    const newQrisUrl = newData.qris?.imageUrl || '';
    if (oldQrisUrl !== newQrisUrl || oldData.qris?.enabled !== newData.qris?.enabled) {
      labels.push('QRIS Pembayaran');
    }
  }

  // 7. Website
  if (newData.websiteUrl !== undefined && newData.websiteUrl !== oldData.websiteUrl) {
    labels.push('Tautan Website');
  }

  // 8. Media Sosial
  if (newData.socials !== undefined) {
    const oldSoc = JSON.stringify(oldData.socials || {});
    const newSoc = JSON.stringify(newData.socials || {});
    if (oldSoc !== newSoc) {
      labels.push('Akun Media Sosial');
    }
  }

  return {
    labels,
    details,
    hasChanges: labels.length > 0
  };
};

/**
 * Standard modules affected by the unified database sync
 */
export const SYNCED_MODULES = [
  'Profil Bisnis (Master)',
  'Pengaturan Toko & Katalog',
  'Nota Tagihan & Invoice',
  'Identitas & Biodata Studio',
  'Halaman Utama Website (Hero, Tentang & Footer)',
  'Footer & Kontak Website'
];

/**
 * Build informative notification message detailing:
 * 1. What fields were updated
 * 2. Which databases/modules are automatically synchronized
 */
export const buildSyncNotificationMessage = (
  changes: DetectedChanges,
  sourceModule: string = 'Form'
): { message: string; title: string; modules: string[] } => {
  const fieldList = changes.labels.length > 0
    ? changes.labels.join(', ')
    : 'Data Terhubung';

  const otherModules = SYNCED_MODULES.filter(m => !m.toLowerCase().includes(sourceModule.toLowerCase()));

  const message = `✅ Berhasil Disimpan & Tersinkron!\n\n` +
    `📝 Data yang dirubah: ${fieldList}\n` +
    `🔄 Otomatis tersambung ke:\n` +
    otherModules.map(m => ` • ${m}`).join('\n');

  return {
    title: 'Data Tersinkron Otomatis',
    message,
    modules: otherModules
  };
};

/**
 * CENTRAL MASTER SYNC ENGINE
 * Updates and ensures two-way consistency across all local and cloud storage keys:
 * 1. porto_business_profile (Master)
 * 2. porto_settings (shopSettings, footer, cmsName, biodata)
 * 3. porto_shop_settings (whatsappNumber, paymentMethods, qris)
 * 4. porto_invoice_settings (shopName, shopPhone, shopAddress, banks)
 * 5. porto_biodata (fullName, company, phone, email, location, website, socialLinks)
 */
export const syncUnifiedStudioData = async (
  partialUpdate: Partial<BusinessProfile> & {
    cmsName?: string;
    siteTitle?: string;
    entityMode?: 'company' | 'personal';
    personalBiodata?: {
      fullName?: string;
      headline?: string;
      bio?: string;
      fullBio?: string;
      avatar?: string;
      coverUrl?: string;
    };
    companyExtra?: {
      foundedYear?: string;
      teamSize?: string;
      vision?: string;
      missionText?: string;
      logoUrl?: string;
      coverUrl?: string;
    };
  },
  sourceModule: string = 'Unified'
): Promise<{ changes: DetectedChanges; notificationText: string }> => {
  // 1. Fetch current master profile
  let currentProfile: BusinessProfile = (await storage.getItem<BusinessProfile | null>(BUSINESS_PROFILE_STORAGE_KEY, null)) || DEFAULT_BUSINESS_PROFILE;

  // 2. Normalize incoming bank accounts if any
  let normalizedBanks: BankAccount[] | undefined = undefined;
  if (partialUpdate.bankAccounts) {
    normalizedBanks = partialUpdate.bankAccounts.map(b => normalizeBankAccount(b, partialUpdate.brandName || currentProfile.brandName));
  }

  // 3. Detect changes compared to current master
  const proposedProfile: BusinessProfile = {
    ...currentProfile,
    ...partialUpdate,
    brandName: partialUpdate.brandName || partialUpdate.cmsName || currentProfile.brandName,
    bankAccounts: normalizedBanks || currentProfile.bankAccounts,
    updatedAt: new Date().toISOString()
  };

  const changes = detectStudioFieldChanges(currentProfile, proposedProfile);

  // 4. Update master Business Profile
  await storage.setItem(BUSINESS_PROFILE_STORAGE_KEY, proposedProfile, true);

  // 5. Update porto_settings (shopSettings, footer, cmsName, etc.)
  try {
    const currentSettings = (await storage.getItem<any>('porto_settings', {})) || {};
    const cleanWa = formatWhatsAppNumber(proposedProfile.whatsapp);

    const updatedShopSettings = {
      ...(currentSettings.shopSettings || {}),
      whatsappNumber: cleanWa,
      paymentMethods: proposedProfile.bankAccounts.map(b => ({
        id: b.id,
        bankName: b.bankName,
        accountName: b.accountName,
        accountNumber: b.accountNumber,
        bankLogo: b.bankLogo || '',
        color: b.color || '#003399'
      })),
      qrisImageUrl: proposedProfile.qris?.imageUrl || currentSettings.shopSettings?.qrisImageUrl || ''
    };

    // Map socials for footer
    const socialLinks = Object.entries(proposedProfile.socials || {})
      .filter(([_, val]) => Boolean(val && val.trim()))
      .map(([platform, val]) => ({
        id: `soc_${platform}`,
        platform: platform.charAt(0).toUpperCase() + platform.slice(1),
        url: val.startsWith('http') ? val : `https://${val}`,
        icon: platform
      }));

    const updatedFooter = {
      ...(currentSettings.footer || {}),
      whatsappNumber: cleanWa,
      email: proposedProfile.email || currentSettings.footer?.email || '',
      location: proposedProfile.address || proposedProfile.city || currentSettings.footer?.location || '',
      description: proposedProfile.description || currentSettings.footer?.description || '',
      socialLinks: socialLinks.length > 0 ? socialLinks : (currentSettings.footer?.socialLinks || [])
    };

    const nextGlobalSettings = {
      ...currentSettings,
      cmsName: proposedProfile.brandName || currentSettings.cmsName,
      shopSettings: updatedShopSettings,
      footer: updatedFooter
    };

    await storage.setItem('porto_settings', nextGlobalSettings, true);
  } catch (err) {
    console.warn('[UnifiedSync] Error syncing to porto_settings:', err);
  }

  // 6. Update porto_shop_settings
  try {
    await storage.setItem('porto_shop_settings', {
      whatsappNumber: formatWhatsAppNumber(proposedProfile.whatsapp),
      paymentMethods: proposedProfile.bankAccounts,
      qrisImageUrl: proposedProfile.qris?.imageUrl || ''
    }, true);
  } catch (err) {
    console.warn('[UnifiedSync] Error syncing to porto_shop_settings:', err);
  }

  // 7. Update porto_invoice_settings
  try {
    const currentInvoice = (await storage.getItem<any>('porto_invoice_settings', {})) || {};
    const updatedInvoice = {
      ...currentInvoice,
      shopName: proposedProfile.brandName || currentInvoice.shopName,
      shopPhone: proposedProfile.whatsapp || currentInvoice.shopPhone,
      shopAddress: proposedProfile.address || currentInvoice.shopAddress,
      banks: proposedProfile.bankAccounts.map(b => ({
        id: b.id,
        name: b.bankName,
        bankName: b.bankName,
        accountNumber: b.accountNumber,
        accountName: b.accountName,
        accountHolder: b.accountName,
        logo: b.bankLogo || '',
        color: b.color || '#003399'
      }))
    };
    await storage.setItem('porto_invoice_settings', updatedInvoice, true);
  } catch (err) {
    console.warn('[UnifiedSync] Error syncing to porto_invoice_settings:', err);
  }

  // 8. Update porto_biodata & porto_settings.biodata (preserve personal fullName separate from company brandName)
  try {
    const currentBiodata = (await storage.getItem<any>('porto_biodata', {})) || {};
    const updatedBiodata = {
      ...currentBiodata,
      fullName: partialUpdate.personalBiodata?.fullName || currentBiodata.fullName || 'Creative Director',
      headline: partialUpdate.personalBiodata?.headline || currentBiodata.headline || proposedProfile.tagline || '',
      company: proposedProfile.brandName || currentBiodata.company,
      phone: proposedProfile.whatsapp || currentBiodata.phone,
      email: proposedProfile.email || currentBiodata.email,
      location: proposedProfile.address || proposedProfile.city || currentBiodata.location,
      website: proposedProfile.websiteUrl || currentBiodata.website,
      bio: partialUpdate.personalBiodata?.bio || currentBiodata.bio || proposedProfile.tagline,
      fullBio: partialUpdate.personalBiodata?.fullBio || currentBiodata.fullBio || proposedProfile.description,
      ...(partialUpdate.personalBiodata?.avatar !== undefined ? { avatar: partialUpdate.personalBiodata.avatar } : {}),
      ...(partialUpdate.personalBiodata?.coverUrl !== undefined ? { coverUrl: partialUpdate.personalBiodata.coverUrl } : {}),
      socialLinks: {
        ...(currentBiodata.socialLinks || {}),
        ...(proposedProfile.socials || {})
      }
    };
    await storage.setItem('porto_biodata', updatedBiodata, true);

    const s = await storage.getItem<any>('porto_settings', {});
    if (s && typeof s === 'object') {
      await storage.setItem('porto_settings', { ...s, biodata: updatedBiodata }, true);
    }
  } catch (err) {
    console.warn('[UnifiedSync] Error syncing to porto_biodata:', err);
  }

  // 8b. Update porto_main_website (LandingPage Hero, AboutSettings, Navbar, Footer)
  try {
    const currentWebsite = (await storage.getItem<any>('porto_main_website', null)) || {};
    const cleanWa = formatWhatsAppNumber(proposedProfile.whatsapp);
    const socialLinksForWeb = Object.entries(proposedProfile.socials || {})
      .filter(([_, val]) => Boolean(val && String(val).trim()))
      .map(([platform, val]) => ({
        id: `soc_${platform}`,
        platform: platform.charAt(0).toUpperCase() + platform.slice(1),
        url: String(val).startsWith('http') ? String(val) : `https://${val}`,
        icon: platform
      }));

    const currentCompanyAbout = currentWebsite.aboutSettings?.company || {};
    const updatedMission = partialUpdate.companyExtra?.missionText
      ? partialUpdate.companyExtra.missionText.split('\n').map(m => m.trim()).filter(Boolean)
      : currentCompanyAbout.mission;

    const nextWebsite = {
      ...currentWebsite,
      ...(partialUpdate.entityMode ? { siteMode: partialUpdate.entityMode } : {}),
      navbar: {
        ...(currentWebsite.navbar || {}),
        logoText: partialUpdate.brandName
          ? proposedProfile.brandName
          : (currentWebsite.navbar?.logoText || proposedProfile.brandName || 'Studio'),
        ...(partialUpdate.companyExtra?.logoUrl ? { logoImage: partialUpdate.companyExtra.logoUrl } : {})
      },
      companyHero: {
        ...(currentWebsite.companyHero || {}),
        headline: proposedProfile.brandName || currentWebsite.companyHero?.headline || 'Studio',
        subheadline: proposedProfile.tagline || currentWebsite.companyHero?.subheadline || '',
        description: proposedProfile.description || currentWebsite.companyHero?.description || '',
        ...(partialUpdate.companyExtra?.coverUrl ? { heroImage: partialUpdate.companyExtra.coverUrl } : {})
      },
      ...(partialUpdate.personalBiodata ? {
        hero: {
          ...(currentWebsite.hero || {}),
          ...(partialUpdate.personalBiodata.fullName ? { headline: partialUpdate.personalBiodata.fullName } : {}),
          ...(partialUpdate.personalBiodata.headline ? { subheadline: partialUpdate.personalBiodata.headline } : {}),
          ...(partialUpdate.personalBiodata.bio ? { description: partialUpdate.personalBiodata.bio } : {}),
          ...(partialUpdate.personalBiodata.avatar ? { heroImage: partialUpdate.personalBiodata.avatar } : {})
        },
        profile: {
          ...(currentWebsite.profile || {}),
          ...(partialUpdate.personalBiodata.bio ? { bio: partialUpdate.personalBiodata.bio } : {}),
          ...(partialUpdate.personalBiodata.fullBio ? { fullBio: partialUpdate.personalBiodata.fullBio } : {}),
          ...(partialUpdate.personalBiodata.avatar ? { image: partialUpdate.personalBiodata.avatar } : {})
        }
      } : {}),
      aboutSettings: {
        ...(currentWebsite.aboutSettings || {}),
        ...(partialUpdate.entityMode ? { mode: partialUpdate.entityMode } : {}),
        company: {
          ...currentCompanyAbout,
          name: proposedProfile.brandName || currentCompanyAbout.name || '',
          tagline: proposedProfile.tagline || currentCompanyAbout.tagline || '',
          description: proposedProfile.description || currentCompanyAbout.description || '',
          headquarters: proposedProfile.address || proposedProfile.city || currentCompanyAbout.headquarters || '',
          website: proposedProfile.websiteUrl || currentCompanyAbout.website || '',
          email: proposedProfile.email || currentCompanyAbout.email || '',
          phone: proposedProfile.whatsapp || currentCompanyAbout.phone || '',
          ...(partialUpdate.companyExtra?.foundedYear ? { foundedYear: partialUpdate.companyExtra.foundedYear } : {}),
          ...(partialUpdate.companyExtra?.teamSize ? { teamSize: partialUpdate.companyExtra.teamSize } : {}),
          ...(partialUpdate.companyExtra?.vision ? { vision: partialUpdate.companyExtra.vision } : {}),
          ...(updatedMission ? { mission: updatedMission } : {})
        }
      },
      footer: {
        ...(currentWebsite.footer || {}),
        email: proposedProfile.email || currentWebsite.footer?.email || '',
        location: proposedProfile.address || proposedProfile.city || currentWebsite.footer?.location || '',
        description: proposedProfile.description || currentWebsite.footer?.description || '',
        ...(socialLinksForWeb.length > 0 ? { socialLinks: socialLinksForWeb } : {}),
        contactMethods: Array.isArray(currentWebsite.footer?.contactMethods)
          ? currentWebsite.footer.contactMethods.map((cm: any) => {
              if (cm.id === 'email' && proposedProfile.email) return { ...cm, value: proposedProfile.email, enabled: true };
              if (cm.id === 'whatsapp' && cleanWa) return { ...cm, value: cleanWa, enabled: true };
              return cm;
            })
          : [
              { id: 'email', label: 'Email', icon: 'email', value: proposedProfile.email || '', enabled: Boolean(proposedProfile.email) },
              { id: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp', value: cleanWa, enabled: Boolean(cleanWa) },
            ]
      }
    };
    await storage.setItem('porto_main_website', nextWebsite, true);
    if (nextWebsite.navbar?.logoText && typeof localStorage !== 'undefined') {
      localStorage.setItem('porto_cached_logotext', nextWebsite.navbar.logoText);
      window.dispatchEvent(new CustomEvent('porto_logotext_updated', { detail: { logoText: nextWebsite.navbar.logoText } }));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('landing_data_updated', { detail: nextWebsite }));
    }
    if (partialUpdate.entityMode && typeof localStorage !== 'undefined') {
      localStorage.setItem('porto_site_mode', partialUpdate.entityMode);
      window.dispatchEvent(new CustomEvent('porto_sitemode_changed', { detail: { mode: partialUpdate.entityMode } }));
    }
  } catch (err) {
    console.warn('[UnifiedSync] Error syncing to porto_main_website:', err);
  }

  // 9. Dispatch custom events for live reactive UI updates across all opened components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('porto_business_profile_updated', { detail: proposedProfile }));
    window.dispatchEvent(new CustomEvent('porto_settings_updated', { detail: proposedProfile }));
    window.dispatchEvent(new CustomEvent('porto_invoice_settings_updated', { detail: proposedProfile }));
    window.dispatchEvent(new CustomEvent('porto_biodata_updated', { detail: proposedProfile }));
    window.dispatchEvent(new CustomEvent('porto_saved'));
  }

  const notif = buildSyncNotificationMessage(changes, sourceModule);
  return {
    changes,
    notificationText: notif.message
  };
};

