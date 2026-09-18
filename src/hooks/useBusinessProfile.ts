import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import { BusinessProfile, DEFAULT_BUSINESS_PROFILE, BankAccount } from '../types/businessProfile';

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
 * Build standard social media URL from handle/username or full URL
 */
export const buildSocialUrl = (platform: string, handleOrUrl?: string): string => {
  if (!handleOrUrl || !handleOrUrl.trim()) return '';
  const val = handleOrUrl.trim();
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  const cleanHandle = val.replace(/^@/, '');

  switch (platform.toLowerCase()) {
    case 'instagram':
      return `https://instagram.com/${cleanHandle}`;
    case 'tiktok':
      return `https://tiktok.com/@${cleanHandle}`;
    case 'youtube':
      return cleanHandle.startsWith('@') ? `https://youtube.com/${cleanHandle}` : `https://youtube.com/@${cleanHandle}`;
    case 'linkedin':
      return cleanHandle.includes('/') ? `https://linkedin.com/${cleanHandle}` : `https://linkedin.com/in/${cleanHandle}`;
    case 'twitter':
    case 'x':
      return `https://x.com/${cleanHandle}`;
    case 'facebook':
      return `https://facebook.com/${cleanHandle}`;
    case 'github':
      return `https://github.com/${cleanHandle}`;
    case 'telegram':
      return `https://t.me/${cleanHandle}`;
    case 'discord':
      return cleanHandle.includes('discord.gg') ? `https://${cleanHandle}` : `https://discord.gg/${cleanHandle}`;
    case 'threads':
      return `https://threads.net/@${cleanHandle}`;
    default:
      return `https://${val}`;
  }
};

export const syncProfileToAllDatabases = async (profile: BusinessProfile) => {
  // 1. Save to master storage key
  await storage.setItem(BUSINESS_PROFILE_STORAGE_KEY, profile);

  // 2. Sync to porto_settings (shopSettings & footer)
  try {
    const settings = (await storage.getItem<any>('porto_settings', {})) || {};
    const cleanWa = formatWhatsAppNumber(profile.whatsapp);

    // Map socials to legacy array
    const socialLinks = Object.entries(profile.socials || {})
      .filter(([_, val]) => Boolean(val && val.trim()))
      .map(([platform, val]) => ({
        id: `soc_${platform}`,
        platform: platform.charAt(0).toUpperCase() + platform.slice(1),
        url: buildSocialUrl(platform, val),
        icon: platform
      }));

    const updatedSettings = {
      ...settings,
      shopSettings: {
        ...(settings.shopSettings || {}),
        whatsappNumber: cleanWa,
        paymentMethods: profile.bankAccounts,
        qrisImageUrl: profile.qris?.imageUrl || settings.shopSettings?.qrisImageUrl || '',
      },
      footer: {
        ...(settings.footer || {}),
        whatsappNumber: cleanWa,
        email: profile.email || settings.footer?.email || '',
        location: profile.address || profile.city || settings.footer?.location || '',
        description: profile.description || settings.footer?.description || '',
        socialLinks: socialLinks.length > 0 ? socialLinks : (settings.footer?.socialLinks || []),
      }
    };

    await storage.setItem('porto_settings', updatedSettings);
  } catch (err) {
    console.warn('Failed to sync business profile to porto_settings', err);
  }

  // 3. Sync to porto_invoice_settings
  try {
    const invoiceSettings = (await storage.getItem<any>('porto_invoice_settings', {})) || {};
    const updatedInvoiceSettings = {
      ...invoiceSettings,
      shopName: profile.brandName || invoiceSettings.shopName,
      shopPhone: profile.whatsapp || invoiceSettings.shopPhone,
      shopAddress: profile.address || invoiceSettings.shopAddress,
      banks: profile.bankAccounts || invoiceSettings.banks || []
    };
    await storage.setItem('porto_invoice_settings', updatedInvoiceSettings);
  } catch (err) {
    console.warn('Failed to sync business profile to porto_invoice_settings', err);
  }

  // 4. Sync to porto_shop_settings
  try {
    await storage.setItem('porto_shop_settings', {
      whatsappNumber: formatWhatsAppNumber(profile.whatsapp),
      paymentMethods: profile.bankAccounts,
      qrisImageUrl: profile.qris?.imageUrl || ''
    });
  } catch (err) {
    console.warn('Failed to sync business profile to porto_shop_settings', err);
  }

  // Dispatch events for all active tabs and components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('porto_business_profile_updated', { detail: profile }));
    window.dispatchEvent(new CustomEvent('porto_settings_updated', { detail: profile }));
    window.dispatchEvent(new CustomEvent('porto_saved'));
  }
};

export function useBusinessProfile() {
  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_BUSINESS_PROFILE);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      let data = await storage.getItem<BusinessProfile | null>(BUSINESS_PROFILE_STORAGE_KEY, null);

      if (!data) {
        // Fallback: migrate from existing porto_settings / porto_invoice_settings
        const settings = await storage.getItem<any>('porto_settings', {});
        const invoiceSettings = await storage.getItem<any>('porto_invoice_settings', {});

        const initialWa = settings?.shopSettings?.whatsappNumber || settings?.footer?.whatsappNumber || DEFAULT_BUSINESS_PROFILE.whatsapp;
        const initialEmail = settings?.footer?.email || DEFAULT_BUSINESS_PROFILE.email;
        const initialBanks: BankAccount[] = (invoiceSettings?.banks && invoiceSettings.banks.length > 0)
          ? invoiceSettings.banks.map((b: any, idx: number) => ({
              id: b.id || `bank_${idx}`,
              bankName: b.name || b.bankName || 'BCA',
              accountNumber: b.accountNumber || '',
              accountName: b.accountName || '',
              bankLogo: b.logo || b.bankLogo || ''
            }))
          : (settings?.shopSettings?.paymentMethods || DEFAULT_BUSINESS_PROFILE.bankAccounts);

        const initialQris = {
          enabled: true,
          imageUrl: settings?.shopSettings?.qrisImageUrl || '',
          merchantName: invoiceSettings?.shopName || DEFAULT_BUSINESS_PROFILE.brandName,
          instruction: DEFAULT_BUSINESS_PROFILE.qris.instruction
        };

        data = {
          ...DEFAULT_BUSINESS_PROFILE,
          brandName: invoiceSettings?.shopName || settings?.cmsName || DEFAULT_BUSINESS_PROFILE.brandName,
          whatsapp: initialWa,
          email: initialEmail,
          address: settings?.footer?.location || invoiceSettings?.shopAddress || DEFAULT_BUSINESS_PROFILE.address,
          description: settings?.footer?.description || DEFAULT_BUSINESS_PROFILE.description,
          bankAccounts: initialBanks,
          qris: initialQris
        };

        // Auto-save so it's initialized
        await storage.setItem(BUSINESS_PROFILE_STORAGE_KEY, data);
      }

      setProfile(data);
    } catch (err) {
      console.error('Error loading business profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();

    const handleUpdated = (e: any) => {
      if (e.detail) {
        setProfile(e.detail);
      } else {
        loadProfile();
      }
    };

    window.addEventListener('porto_business_profile_updated', handleUpdated);
    const unsub = storage.listenItem<BusinessProfile>(BUSINESS_PROFILE_STORAGE_KEY, (val) => {
      if (val) setProfile(val);
    });

    return () => {
      window.removeEventListener('porto_business_profile_updated', handleUpdated);
      if (unsub) unsub();
    };
  }, [loadProfile]);

  const updateProfile = async (newProfile: BusinessProfile) => {
    setProfile(newProfile);
    await syncProfileToAllDatabases(newProfile);
  };

  const getCleanWa = () => formatWhatsAppNumber(profile.whatsapp);

  const getSendWaUrl = (text: string, overrideWa?: string) => {
    const wa = formatWhatsAppNumber(overrideWa || profile.whatsapp);
    return `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
  };

  return {
    profile,
    loading,
    updateProfile,
    getCleanWa,
    getSendWaUrl,
    formatWhatsAppNumber,
    buildSocialUrl
  };
}
