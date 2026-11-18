import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import { BusinessProfile, DEFAULT_BUSINESS_PROFILE, BankAccount } from '../types/businessProfile';
import {
  BUSINESS_PROFILE_STORAGE_KEY,
  formatWhatsAppNumber,
  syncUnifiedStudioData,
  detectStudioFieldChanges,
  buildSyncNotificationMessage,
  DetectedChanges
} from '../utils/unifiedDataSync';

export { BUSINESS_PROFILE_STORAGE_KEY, formatWhatsAppNumber };

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

/**
 * Sync profile across all modules and databases
 */
export const syncProfileToAllDatabases = async (profile: BusinessProfile, sourceModule: string = 'Profil Bisnis') => {
  return await syncUnifiedStudioData(profile, sourceModule);
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
              accountName: b.accountName || b.accountHolder || 'ARIF DARMAWAN',
              bankLogo: b.logo || b.bankLogo || '',
              color: b.color || '#003399'
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

        // Auto-save so it's initialized across all databases
        await syncUnifiedStudioData(data, 'Inisialisasi');
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

  const updateProfile = async (newProfile: BusinessProfile, sourceModule: string = 'Profil Bisnis') => {
    setProfile(newProfile);
    const result = await syncUnifiedStudioData(newProfile, sourceModule);
    return result;
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
