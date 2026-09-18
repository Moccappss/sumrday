import { get, set, del } from 'idb-keyval';
import { ClientGameLicense, ClientTier, LicenseModel } from '../types/gameLicense';
import { fetchClientLicensesFromFirestore } from '../services/gameService';

const IDB_KEY_PREFIX = 'agenze_client_licenses_';

export interface LicenseCheckResult {
  hasAccess: boolean;
  reason?: 'active' | 'not_found' | 'expired' | 'suspended';
  model?: LicenseModel;
  tier?: ClientTier;
  license?: ClientGameLicense;
}

/**
 * 1x Read Firestore: Dijalankan tepat saat user login.
 * Mengambil data lisensi aktif dari Firestore dan menyimpannya ke IndexedDB lokal.
 */
export const syncClientLicensesToIndexedDb = async (clientId: string, clientEmail?: string): Promise<ClientGameLicense[]> => {
  if (!clientId && !clientEmail) return [];
  try {
    console.log('[Zero-Read Firestore] Melakukan 1x fetch lisensi untuk client:', clientId || clientEmail);
    const licenses = await fetchClientLicensesFromFirestore(clientId, clientEmail);
    
    // Simpan ke IndexedDB dengan key spesifik client
    const storageKey = `${IDB_KEY_PREFIX}${clientId || clientEmail}`;
    await set(storageKey, licenses);
    console.log(`[Zero-Read Firestore] ${licenses.length} lisensi tersimpan di IndexedDB.`);
    return licenses;
  } catch (error) {
    console.error('[Zero-Read Firestore] Gagal sinkronisasi lisensi ke IndexedDB:', error);
    // Fallback: kembalikan lisensi lokal yang sudah ada jika offline
    return getOfflineLicenses(clientId, clientEmail);
  }
};

/**
 * Mengambil seluruh lisensi milik klien secara murni dari IndexedDB (Offline-First, Zero Firestore Reads).
 */
export const getOfflineLicenses = async (clientId: string, clientEmail?: string): Promise<ClientGameLicense[]> => {
  try {
    const storageKey = `${IDB_KEY_PREFIX}${clientId || clientEmail}`;
    const cached = await get<ClientGameLicense[]>(storageKey);
    return cached || [];
  } catch (err) {
    console.warn('[IndexedDB] Gagal membaca lisensi offline:', err);
    return [];
  }
};

/**
 * LicenseChecker Offline-First:
 * Memvalidasi apakah user memiliki lisensi aktif untuk game tertentu (gameId atau slug).
 * Dijalankan murni dari IndexedDB tanpa memicu pembacaan (0 Read) Firestore sama sekali.
 */
export const licenseChecker = async (
  clientId: string,
  gameIdOrSlug: string,
  clientEmail?: string
): Promise<LicenseCheckResult> => {
  const licenses = await getOfflineLicenses(clientId, clientEmail);

  // Cari lisensi yang cocok dengan gameId
  const license = licenses.find(l => l.gameId === gameIdOrSlug || l.id.includes(gameIdOrSlug));

  if (!license) {
    return {
      hasAccess: false,
      reason: 'not_found'
    };
  }

  if (license.status === 'suspended') {
    return {
      hasAccess: false,
      reason: 'suspended',
      license
    };
  }

  // Cek masa berlaku untuk model rental
  if (license.model === 'rental' && license.expiryDate) {
    if (license.expiryDate < Date.now()) {
      return {
        hasAccess: false,
        reason: 'expired',
        model: license.model,
        tier: license.tier,
        license
      };
    }
  }

  // Aktif (Lifetime atau Rental yang belum kedaluwarsa)
  return {
    hasAccess: true,
    reason: 'active',
    model: license.model,
    tier: license.tier,
    license
  };
};

/**
 * Hapus cache lisensi IndexedDB saat user logout
 */
export const clearOfflineLicenses = async (clientId: string, clientEmail?: string): Promise<void> => {
  try {
    const storageKey = `${IDB_KEY_PREFIX}${clientId || clientEmail}`;
    await del(storageKey);
  } catch (err) {
    console.warn('[IndexedDB] Gagal menghapus lisensi offline:', err);
  }
};

