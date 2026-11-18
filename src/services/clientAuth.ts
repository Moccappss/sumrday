import { auth, db } from '../firebase';
import { signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, query, where, serverTimestamp, updateDoc } from 'firebase/firestore';
import { storage } from '../utils/storage';

/**
 * Ensure Client has a valid Firebase Auth Session Token (via anonymous auth)
 * to guarantee legitimate JWT token and avoid unauthenticated Firestore rejections.
 */
export async function ensureClientFirebaseAuthSession(): Promise<void> {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (err) {
    console.warn('[clientAuth] Firebase anonymous auth session warning:', err);
  }
}

export type ClientTier = 'regular' | 'reseller' | 'affiliate' | 'vip';

export interface ClientBankDetails {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface ClientUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
  role: 'client';
  rawPassword?: string;
  membershipTier?: ClientTier;
  affiliateCode?: string;
  affiliateCommissionRate?: number; // e.g. 10 (%)
  resellerDiscountRate?: number; // e.g. 15 (%)
  affiliateBalance?: number; // Saldo komisi siap tarik (IDR)
  affiliateTotalEarnings?: number; // Total komisi kumulatif (IDR)
  affiliateSalesCount?: number; // Total transaksi referral berhasil
  bankDetails?: ClientBankDetails;
}

export interface ClientOrder {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  productName: string;
  productId?: string;
  variantName?: string;
  price: number;
  quantity: number;
  total: number;
  status: 'Pending' | 'Diproses' | 'Selesai' | 'Dibatalkan';
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  downloadUrl?: string;
  fileFormat?: string;
  fileSize?: string;
  instantDeliveryMessage?: string;
  isDigitalAsset?: boolean;
  orderType?: 'jasa' | 'beli_putus' | 'preorder';
  preOrderBatch?: string;
  preOrderEstimate?: string;
  paymentScheme?: 'dp' | 'full';
  dpAmount?: number;
  remainingAmount?: number;
  paymentStatus?: 'belum' | 'dp' | 'lunas' | 'quotation';
  milestoneStep?: number; // Step 1 - 5
  trackingNumber?: string; // No Resi atau link pengiriman
  // Digital Asset Duration & Access Control
  accessModel?: 'lifetime' | 'limited'; // 'lifetime' (Selamanya) | 'limited' (Batas Waktu)
  durationDays?: number; // Jumlah hari masa aktif (misal: 7, 30, 90, 365)
  expiryDate?: string | null; // Tanggal kedaluwarsa ISO format (YYYY-MM-DDTHH:mm:ss.sssZ atau YYYY-MM-DD)
  assetStatus?: 'active' | 'expired' | 'revoked'; // default 'active'
  accessRevokedReason?: string;
  clientDriveUrl?: string;
  figmaUrl?: string;
  previewUrl?: string;
}

/**
 * Universal helper to differentiate Jasa (Services) from Outright Products (Beli Putus)
 */
export const isServiceProduct = (item: any): boolean => {
  if (!item) return false;
  if (item.type === 'Jasa') return true;
  if (item.productId && typeof item.productId === 'string' && (item.productId.startsWith('ratecard_') || item.productId.startsWith('addon_'))) return true;
  if (item.id && typeof item.id === 'string' && (item.id.startsWith('ratecard_') || item.id.startsWith('addon_'))) return true;
  if (item.serviceDpAllowed !== undefined && item.serviceDpAllowed !== null) return true;
  if (Array.isArray(item.deliverables) && item.deliverables.length > 0) return true;
  const cat = (item.category || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  return (
    cat.includes('jasa') ||
    cat.includes('layanan') ||
    cat.includes('service') ||
    cat.includes('proyek') ||
    cat.includes('custom') ||
    cat.includes('ratecard') ||
    cat.includes('rate card') ||
    cat.includes('paket') ||
    cat.includes('branding') ||
    cat.includes('design') ||
    cat.includes('desain') ||
    cat.includes('logo') ||
    cat.includes('ui/ux') ||
    cat.includes('packaging') ||
    cat.includes('retainer') ||
    name.includes('jasa') ||
    name.includes('layanan') ||
    name.includes('paket') ||
    name.includes('desain') ||
    name.includes('branding') ||
    name.includes('logo') ||
    name.includes('ui/ux') ||
    name.includes('kemasan') ||
    name.includes('retainer')
  );
};

const LOCAL_CLIENT_KEY = 'porto_current_client';
const LOCAL_CLIENTS_STORE = 'porto_clients_cache';
const LOCAL_ORDERS_KEY = 'porto_client_orders';

// Legacy fast hash for backward compatibility with existing accounts
export const legacyHashSecret = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'pw_' + Math.abs(hash).toString(36) + '_' + str.length;
};

// Cryptographic hash for client passwords with salt
export async function secureHashPassword(str: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode('sumrday_client_auth_salt_v2:' + str);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return 'sha256_' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (_) {}
  return legacyHashSecret(str);
}

// Verification helper supporting modern SHA-256 and legacy hash with upgrade flag
export async function verifyPasswordHash(password: string, existingHash?: string): Promise<{ valid: boolean; needsUpgrade: boolean; modernHash: string }> {
  const modernHash = await secureHashPassword(password);
  if (!existingHash) return { valid: false, needsUpgrade: false, modernHash };
  if (existingHash === modernHash) {
    return { valid: true, needsUpgrade: false, modernHash };
  }
  const legacyHash = legacyHashSecret(password);
  if (existingHash === legacyHash) {
    return { valid: true, needsUpgrade: true, modernHash };
  }
  return { valid: false, needsUpgrade: false, modernHash };
}

// Helper to get local clients db cache
const getLocalClients = (): Record<string, any> => {
  try {
    const raw = localStorage.getItem(LOCAL_CLIENTS_STORE);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
};

const saveLocalClients = (clients: Record<string, any>) => {
  try {
    localStorage.setItem(LOCAL_CLIENTS_STORE, JSON.stringify(clients));
  } catch (_) {}
};

/**
 * Register a new Client
 */
export async function registerClient(params: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<ClientUser> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const phoneTrimmed = (params.phone || '').trim();

  if (!phoneTrimmed) {
    throw new Error('Nomor WhatsApp wajib diisi untuk verifikasi & pemesanan.');
  }

  const clientId = 'cli_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  const passwordHash = await secureHashPassword(params.password);
  const nowStr = new Date().toISOString();

  // Ensure client has a valid Firebase Auth JWT session
  await ensureClientFirebaseAuthSession();

  const newClient: ClientUser = {
    id: clientId,
    name: params.name.trim(),
    email: normalizedEmail,
    phone: phoneTrimmed,
    avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(params.name)}`,
    createdAt: nowStr,
    lastLoginAt: nowStr,
    role: 'client',
  };

  // 1. Check local cache
  const localDb = getLocalClients();
  if (Object.values(localDb).some((u: any) => u.email === normalizedEmail)) {
    throw new Error('Email ini sudah terdaftar. Silakan gunakan email lain atau langsung Masuk.');
  }

  // 2. Check Firestore if connected
  try {
    const q = query(collection(db, 'porto_clients'), where('email', '==', normalizedEmail));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error('Email ini sudah terdaftar. Silakan masuk.');
    }

    // Save to Firestore with secure passwordHash
    await setDoc(doc(db, 'porto_clients', clientId), {
      ...newClient,
      passwordHash,
      createdAtServer: serverTimestamp(),
    });
  } catch (err: any) {
    if (err.message && err.message.includes('sudah terdaftar')) throw err;
    console.warn('[clientAuth] Firestore offline or permission denied, using local cache:', err);
  }

  // Save to local cache with passwordHash
  localDb[clientId] = { ...newClient, passwordHash };
  saveLocalClients(localDb);

  // Sync to Admin Transactions Customers database (porto_trx_customers)
  syncClientToCustomers(newClient);

  // Sync to Storage Partitions (Google Drive & Sheets)
  storage.getItem('porto_clients', []).then((clients) => {
    const list = Array.isArray(clients) ? [...clients] : [];
    if (!list.some((c: any) => c.id === clientId || c.email === newClient.email)) {
      list.push(newClient);
      storage.setItem('porto_clients', list).catch(() => {});
    }
  }).catch(() => {});

  storage.getItem('porto_users', []).then((users) => {
    const list = Array.isArray(users) ? [...users] : [];
    if (!list.some((u: any) => u.id === clientId || u.email === newClient.email)) {
      list.push({ ...newClient, role: 'client' });
      storage.setItem('porto_users', list).catch(() => {});
    }
  }).catch(() => {});

  // Set session
  localStorage.setItem(LOCAL_CLIENT_KEY, JSON.stringify(newClient));
  window.dispatchEvent(new CustomEvent('porto_client_auth_changed', { detail: { client: newClient } }));

  return newClient;
}

/**
 * Sync Client User to porto_trx_customers so they are immediately accessible in Admin Transactions CRM
 */
export async function syncClientToCustomers(client: ClientUser, address: string = '-') {
  try {
    const existing = await storage.getItem('porto_trx_customers', []);
    const list = Array.isArray(existing) ? [...existing] : [];
    
    const idx = list.findIndex((c: any) => 
      (c.clientId && c.clientId === client.id) || 
      (c.phone && client.phone && c.phone.replace(/\D/g, '') === client.phone.replace(/\D/g, '')) ||
      (c.email && client.email && c.email.toLowerCase() === client.email.toLowerCase())
    );

    const customerObj = {
      id: idx > -1 ? list[idx].id : `CUS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      clientId: client.id,
      name: client.name,
      phone: client.phone || '',
      email: client.email || '',
      address: address !== '-' ? address : (idx > -1 ? list[idx].address || '-' : '-'),
      avatar: client.avatar || '',
      source: 'client_account',
      isRegisteredClient: true,
      updatedAt: new Date().toISOString()
    };

    if (idx > -1) {
      list[idx] = { ...list[idx], ...customerObj };
    } else {
      list.unshift(customerObj);
    }

    await storage.setItem('porto_trx_customers', list);
  } catch (e) {
    console.warn('[clientAuth] syncClientToCustomers warning:', e);
  }
}

/**
 * Login an existing Client
 */
export async function loginClient(email: string, password: string): Promise<ClientUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const nowStr = new Date().toISOString();

  let matchedClient: (ClientUser & { passwordHash?: string }) | null = null;
  let verifiedHash = '';

  // 1. Try checking Firestore
  try {
    const q = query(collection(db, 'porto_clients'), where('email', '==', normalizedEmail));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data() as any;
      const storedHash = docData.passwordHash || (docData.rawPassword ? legacyHashSecret(docData.rawPassword) : '');
      const check = await verifyPasswordHash(password, storedHash);

      if (check.valid) {
        verifiedHash = check.modernHash;
        matchedClient = {
          id: snapshot.docs[0].id,
          name: docData.name,
          email: docData.email,
          phone: docData.phone || '',
          avatar: docData.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(docData.name)}`,
          createdAt: docData.createdAt || nowStr,
          lastLoginAt: nowStr,
          role: 'client',
        };

        // Update last login and upgrade hash to modern SHA-256 if needed
        const updatePayload: Record<string, any> = { lastLoginAt: nowStr };
        if (check.needsUpgrade || !docData.passwordHash) {
          updatePayload.passwordHash = check.modernHash;
        }
        updateDoc(doc(db, 'porto_clients', snapshot.docs[0].id), updatePayload).catch(() => {});
      } else {
        throw new Error('Kata sandi yang Anda masukkan salah.');
      }
    }
  } catch (err: any) {
    if (err.message && (err.message.includes('Kata sandi') || err.message.includes('password'))) {
      throw err;
    }
    console.warn('[clientAuth] Firestore lookup warning, checking local storage cache:', err);
  }

  // 2. Fallback to local storage if not found in Firestore or offline
  if (!matchedClient) {
    const localDb = getLocalClients();
    const found: any = Object.values(localDb).find((u: any) => u.email === normalizedEmail);
    if (found) {
      const storedHash = found.passwordHash || (found.rawPassword ? legacyHashSecret(found.rawPassword) : '');
      const check = await verifyPasswordHash(password, storedHash);

      if (check.valid) {
        verifiedHash = check.modernHash;
        matchedClient = {
          id: found.id,
          name: found.name,
          email: found.email,
          phone: found.phone || '',
          avatar: found.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(found.name)}`,
          createdAt: found.createdAt || nowStr,
          lastLoginAt: nowStr,
          role: 'client',
        };
      } else {
        throw new Error('Kata sandi yang Anda masukkan salah.');
      }
    }
  }

  if (!matchedClient) {
    throw new Error('Akun dengan email ini belum terdaftar. Silakan Daftar terlebih dahulu.');
  }

  // Ensure client has a valid Firebase Auth JWT session
  await ensureClientFirebaseAuthSession();

  // Update session & cache
  localStorage.setItem(LOCAL_CLIENT_KEY, JSON.stringify(matchedClient));
  const localDb = getLocalClients();
  localDb[matchedClient.id] = { 
    ...localDb[matchedClient.id], 
    ...matchedClient, 
    passwordHash: verifiedHash || localDb[matchedClient.id]?.passwordHash 
  };
  saveLocalClients(localDb);

  window.dispatchEvent(new CustomEvent('porto_client_auth_changed', { detail: { client: matchedClient } }));
  return matchedClient;
}

/**
 * Login or Register Client via Google Account
 */
export async function loginClientWithGoogle(): Promise<ClientUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const email = (user.email || '').trim().toLowerCase();
  const name = user.displayName || email.split('@')[0] || 'Klien Google';
  const avatar = user.photoURL || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`;
  const nowStr = new Date().toISOString();

  let matchedClient: ClientUser | null = null;

  // 1. Check if client already exists in Firestore
  try {
    const q = query(collection(db, 'porto_clients'), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data() as any;
      matchedClient = {
        id: snapshot.docs[0].id,
        name: docData.name || name,
        email: docData.email || email,
        phone: docData.phone || user.phoneNumber || '',
        avatar: docData.avatar || avatar,
        createdAt: docData.createdAt || nowStr,
        lastLoginAt: nowStr,
        tier: docData.tier || 'regular',
        role: 'client',
      };
      updateDoc(doc(db, 'porto_clients', snapshot.docs[0].id), { 
        lastLoginAt: nowStr,
        avatar: matchedClient.avatar
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('[clientAuth] Google lookup in Firestore warning:', err);
  }

  // 2. If not found in Firestore, check local cache
  if (!matchedClient) {
    const localDb = getLocalClients();
    const found: any = Object.values(localDb).find((u: any) => u.email === email);
    if (found) {
      matchedClient = {
        id: found.id,
        name: found.name || name,
        email: found.email || email,
        phone: found.phone || user.phoneNumber || '',
        avatar: found.avatar || avatar,
        createdAt: found.createdAt || nowStr,
        lastLoginAt: nowStr,
        tier: found.tier || 'regular',
        role: 'client',
      };
    }
  }

  // 3. If new user, create client record
  if (!matchedClient) {
    const clientId = user.uid || ('cl_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6));
    matchedClient = {
      id: clientId,
      name,
      email,
      phone: user.phoneNumber || '',
      avatar,
      createdAt: nowStr,
      lastLoginAt: nowStr,
      tier: 'regular',
      role: 'client'
    };

    // Save to Firestore
    setDoc(doc(db, 'porto_clients', clientId), {
      ...matchedClient,
      provider: 'google',
      serverCreatedAt: serverTimestamp(),
    }).catch(e => console.warn('[clientAuth] Firestore Google register warning:', e));

    // Sync to CRM Customers
    syncClientToCustomers(matchedClient);
  }

  // Cache in localStorage
  localStorage.setItem(LOCAL_CLIENT_KEY, JSON.stringify(matchedClient));
  const localDb = getLocalClients();
  localDb[matchedClient.id] = { ...localDb[matchedClient.id], ...matchedClient };
  saveLocalClients(localDb);

  window.dispatchEvent(new CustomEvent('porto_client_auth_changed', { detail: { client: matchedClient } }));
  return matchedClient;
}

/**
 * Logout Client
 */
export function logoutClient() {
  localStorage.removeItem(LOCAL_CLIENT_KEY);
  window.dispatchEvent(new CustomEvent('porto_client_auth_changed', { detail: { client: null } }));
}

/**
 * Get currently logged-in Client
 */
export function getCurrentClient(): ClientUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_CLIENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export type PartnerBadgeLevel = 'bronze' | 'silver' | 'gold';

export interface PartnerBadgeProgress {
  level: PartnerBadgeLevel;
  levelName: string;
  minSales: number;
  nextLevelName: string | null;
  targetSales: number;
  progressPercent: number;
  currentCommission: number;
  currentDiscount: number;
  badgeColor: string;
  badgeBg: string;
}

/**
 * Menghitung kasta kemitraan reseller/afiliasi secara dinamis (Bronze, Silver, Gold)
 */
export function calculatePartnerTierProgress(salesCount: number = 0, customCommissionRate?: number): PartnerBadgeProgress {
  const count = salesCount || 0;
  if (count >= 15) {
    return {
      level: 'gold',
      levelName: 'Gold Agency Partner',
      minSales: 15,
      nextLevelName: null,
      targetSales: 15,
      progressPercent: 100,
      currentCommission: customCommissionRate || 12,
      currentDiscount: 12,
      badgeColor: '#f59e0b',
      badgeBg: 'rgba(245, 158, 11, 0.15)'
    };
  } else if (count >= 5) {
    return {
      level: 'silver',
      levelName: 'Silver Growth Partner',
      minSales: 5,
      nextLevelName: 'Gold Agency Partner',
      targetSales: 15,
      progressPercent: Math.min(100, Math.round(((count - 5) / 10) * 100)),
      currentCommission: customCommissionRate || 8,
      currentDiscount: 8,
      badgeColor: '#94a3b8',
      badgeBg: 'rgba(148, 163, 184, 0.15)'
    };
  } else {
    return {
      level: 'bronze',
      levelName: 'Bronze Starter Partner',
      minSales: 0,
      nextLevelName: 'Silver Growth Partner',
      targetSales: 5,
      progressPercent: Math.min(100, Math.round((count / 5) * 100)),
      currentCommission: customCommissionRate || 5,
      currentDiscount: 5,
      badgeColor: '#d97706',
      badgeBg: 'rgba(217, 119, 6, 0.15)'
    };
  }
}

/**
 * Generate a unique, clean Affiliate Referral Code
 */
export function generateAffiliateCode(name: string, id?: string): string {
  const cleanName = (name || 'MITRA')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  const randomSuffix = (id || Math.random().toString(36))
    .slice(-4)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return `${cleanName || 'MITRA'}${randomSuffix || '88'}`;
}

/**
 * Update Client Profile
 */
export async function updateClientProfile(params: {
  name: string;
  phone?: string;
  avatar?: string;
  bankDetails?: ClientBankDetails;
}): Promise<ClientUser> {
  const current = getCurrentClient();
  if (!current) throw new Error('Anda belum login.');

  const updated: ClientUser = {
    ...current,
    name: params.name.trim(),
    phone: params.phone !== undefined ? params.phone.trim() : current.phone,
    avatar: params.avatar || current.avatar,
    bankDetails: params.bankDetails !== undefined ? params.bankDetails : current.bankDetails,
  };

  // 1. Update Firestore
  try {
    await ensureClientFirebaseAuthSession();
    const firestoreData: any = {
      name: updated.name,
      phone: updated.phone || '',
      avatar: updated.avatar,
    };
    if (updated.bankDetails) {
      firestoreData.bankDetails = updated.bankDetails;
    }
    await updateDoc(doc(db, 'porto_clients', current.id), firestoreData);
  } catch (e) {
    console.warn('[clientAuth] Firestore profile update warning:', e);
  }

  // 2. Update local storage
  localStorage.setItem(LOCAL_CLIENT_KEY, JSON.stringify(updated));
  const localDb = getLocalClients();
  if (localDb[current.id]) {
    localDb[current.id] = { ...localDb[current.id], ...updated };
    saveLocalClients(localDb);
  }

  // 3. Sync with Admin Transactions Customers (porto_trx_customers)
  syncClientToCustomers(updated);

  window.dispatchEvent(new CustomEvent('porto_client_auth_changed', { detail: { client: updated } }));
  return updated;
}

/**
 * Update Client Membership Tier & Affiliate Settings (Admin or Client)
 */
export async function updateClientTier(
  clientId: string,
  params: {
    membershipTier: ClientTier;
    affiliateCode?: string;
    affiliateCommissionRate?: number;
    resellerDiscountRate?: number;
    affiliateBalance?: number;
    affiliateTotalEarnings?: number;
    affiliateSalesCount?: number;
    bankDetails?: ClientBankDetails;
  }
): Promise<ClientUser> {
  // Update Firestore
  try {
    await ensureClientFirebaseAuthSession();
    const ref = doc(db, 'porto_clients', clientId);
    await updateDoc(ref, {
      ...params,
      updatedAtServer: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[clientAuth] Firestore updateClientTier offline/warning:', err);
  }

  // Update localDb cache
  const localDb = getLocalClients();
  if (localDb[clientId]) {
    localDb[clientId] = { ...localDb[clientId], ...params };
    saveLocalClients(localDb);
  }

  // Update current client session if active
  const current = getCurrentClient();
  let updatedClient: ClientUser;
  if (current && current.id === clientId) {
    updatedClient = { ...current, ...params };
    localStorage.setItem(LOCAL_CLIENT_KEY, JSON.stringify(updatedClient));
    window.dispatchEvent(new CustomEvent('porto_client_auth_changed', { detail: { client: updatedClient } }));
  } else {
    updatedClient = (localDb[clientId] || { id: clientId, ...params }) as ClientUser;
  }

  // Sync to storage 'porto_clients'
  try {
    const list = await storage.getItem('porto_clients', []);
    if (Array.isArray(list)) {
      const idx = list.findIndex((c: any) => c.id === clientId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...params };
        await storage.setItem('porto_clients', list);
      }
    }
  } catch (_) {}

  return updatedClient;
}

/**
 * Credit commission to affiliate partner upon successful checkout with referral code
 */
export async function creditAffiliateReferral(
  referralCode: string,
  orderTotal: number,
  trxId: string,
  buyerName?: string
): Promise<{ success: boolean; partnerName?: string; commission?: number }> {
  if (!referralCode || !orderTotal) return { success: false };
  const cleanCode = referralCode.trim().toUpperCase();

  try {
    const list = await storage.getItem<any[]>('porto_clients', []);
    if (!Array.isArray(list) || list.length === 0) return { success: false };

    const partner = list.find((c: any) => 
      (c.affiliateCode && c.affiliateCode.trim().toUpperCase() === cleanCode) ||
      (c.id && c.id.substring(0, 8).toUpperCase() === cleanCode)
    );

    if (!partner) return { success: false };

    const rate = partner.affiliateCommissionRate || 10;
    const commission = Math.round(orderTotal * (rate / 100));
    if (commission <= 0) return { success: false };

    // Update partner balances
    const newBal = (Number(partner.affiliateBalance) || 0) + commission;
    const newTot = (Number(partner.affiliateTotalEarnings) || 0) + commission;
    const newCount = (Number(partner.affiliateSalesCount) || 0) + 1;

    await updateClientTier(partner.id, {
      membershipTier: partner.membershipTier || 'affiliate',
      affiliateBalance: newBal,
      affiliateTotalEarnings: newTot,
      affiliateSalesCount: newCount
    });

    // Record ledger log in porto_affiliate_earnings
    try {
      const existingLogs = await storage.getItem<any[]>('porto_affiliate_earnings', []);
      const newLog = {
        id: `EARN-${Date.now()}`,
        partnerId: partner.id,
        partnerName: partner.name,
        referralCode: cleanCode,
        orderId: trxId,
        buyerName: buyerName || 'Pelanggan Toko',
        orderTotal,
        commissionRate: rate,
        commissionAmount: commission,
        date: new Date().toISOString(),
        status: 'credited'
      };
      await storage.setItem('porto_affiliate_earnings', [newLog, ...(existingLogs || [])]);
      window.dispatchEvent(new CustomEvent('porto_affiliate_updated'));
    } catch (e) {
      console.warn('[clientAuth] Failed saving affiliate earning log:', e);
    }

    return { success: true, partnerName: partner.name, commission };
  } catch (err) {
    console.warn('[clientAuth] creditAffiliateReferral error:', err);
    return { success: false };
  }
}

/**
 * Change Client Password
 */
export async function changeClientPassword(oldPassword: string, newPassword: string): Promise<void> {
  const current = getCurrentClient();
  if (!current) throw new Error('Anda belum login.');

  const newHash = await secureHashPassword(newPassword);

  let verified = false;

  // 1. Check Firestore
  try {
    await ensureClientFirebaseAuthSession();
    const docSnap = await getDoc(doc(db, 'porto_clients', current.id));
    if (docSnap.exists()) {
      const docData = docSnap.data() as any;
      const storedHash = docData.passwordHash || (docData.rawPassword ? legacyHashSecret(docData.rawPassword) : '');
      const check = await verifyPasswordHash(oldPassword, storedHash);
      if (check.valid) {
        verified = true;
        await updateDoc(doc(db, 'porto_clients', current.id), {
          passwordHash: newHash,
        });
      } else {
        throw new Error('Kata sandi lama yang Anda masukkan tidak sesuai.');
      }
    }
  } catch (e: any) {
    if (e.message && e.message.includes('tidak sesuai')) throw e;
  }

  // 2. Check local storage cache
  const localDb = getLocalClients();
  if (localDb[current.id]) {
    const storedLocalHash = localDb[current.id].passwordHash || (localDb[current.id].rawPassword ? legacyHashSecret(localDb[current.id].rawPassword) : '');
    const localCheck = await verifyPasswordHash(oldPassword, storedLocalHash);
    if (localCheck.valid || !verified) {
      if (storedLocalHash && !localCheck.valid) {
        throw new Error('Kata sandi lama yang Anda masukkan tidak sesuai.');
      }
      localDb[current.id].passwordHash = newHash;
      saveLocalClients(localDb);
      verified = true;
    }
  }

  if (!verified) {
    throw new Error('Gagal memverifikasi kata sandi lama.');
  }
}

/**
 * Client Orders Management
 */
export async function getClientOrders(clientId: string): Promise<ClientOrder[]> {
  const orders: ClientOrder[] = [];
  const currentClient = getCurrentClient();

  // Try Firestore
  try {
    const q = query(collection(db, 'porto_orders'), where('clientId', '==', clientId));
    const snapshot = await getDocs(q);
    snapshot.forEach((d) => {
      orders.push({ id: d.id, ...(d.data() as any) });
    });
  } catch (e) {
    console.warn('[clientAuth] Firestore orders fetch warning:', e);
  }

  // Combine with local orders
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (raw) {
      const localOrders: ClientOrder[] = JSON.parse(raw);
      localOrders
        .filter((o) => o.clientId === clientId)
        .forEach((lo) => {
          if (!orders.some((o) => o.id === lo.id)) {
            orders.push(lo);
          }
        });
    }
  } catch (_) {}

  // Interconnection: Also pull from porto_transactions matching this client
  try {
    const [trxList, catalogList] = await Promise.all([
      storage.getItem('porto_transactions', []),
      storage.getItem('porto_catalog_products', [])
    ]);
    if (Array.isArray(trxList)) {
      const clientEmail = (currentClient?.email || '').trim().toLowerCase();
      const clientPhone = (currentClient?.phone || '').trim();

      trxList.forEach((trx: any) => {
        if (!trx || !trx.id) return;
        const cust = trx.customer || {};
        const custEmail = (cust.email || '').trim().toLowerCase();
        const custPhone = (cust.phone || '').trim();
        const isMatch = (cust.clientId && cust.clientId === clientId) ||
                        (clientEmail && custEmail && custEmail === clientEmail) ||
                        (clientPhone && custPhone && (custPhone === clientPhone || custPhone.replace(/\D/g, '') === clientPhone.replace(/\D/g, '')));

        if (isMatch && !orders.some(o => o.id === trx.id)) {
          const statusMap: Record<string, ClientOrder['status']> = {
            lunas: 'Selesai',
            dp: 'Diproses',
            belum: 'Pending',
            quotation: 'Pending',
          };
          const itemSummary = (trx.items || []).map((i: any) => `${i.name || 'Produk'}${i.qty > 1 ? ` (x${i.qty})` : ''}`).join(', ') || 'Transaksi Agensi';
          
          // Match with catalog to check for digital asset
          const firstItem = (trx.items || [])[0] || {};
          const matchedCatalogProd = Array.isArray(catalogList) ? catalogList.find((p: any) => 
            p.id === firstItem.id || p.id === firstItem.productId || (p.name && p.name.toLowerCase() === (firstItem.name || '').toLowerCase())
          ) : null;

          orders.push({
            id: trx.id,
            clientId: clientId,
            clientName: cust.name || currentClient?.name || 'Klien',
            clientPhone: cust.phone || currentClient?.phone || '',
            clientEmail: cust.email || currentClient?.email || '',
            productName: itemSummary,
            productId: firstItem.id || firstItem.productId,
            price: trx.grandTotal || 0,
            quantity: 1,
            total: trx.grandTotal || 0,
            status: statusMap[trx.paymentStatus] || 'Pending',
            paymentMethod: trx.paymentMethod?.bankName || (trx.paymentStatus === 'lunas' ? 'Lunas' : 'Invoice Agensi'),
            notes: trx.notes || (trx.driveUrl ? `Nota PDF: ${trx.driveUrl}` : ''),
            createdAt: trx.createdAt || trx.date || new Date().toISOString(),
            downloadUrl: matchedCatalogProd?.downloadUrl || firstItem.downloadUrl,
            fileFormat: matchedCatalogProd?.fileFormat || 'ZIP',
            fileSize: matchedCatalogProd?.fileSize || '',
            instantDeliveryMessage: matchedCatalogProd?.instantDeliveryMessage || '',
            isDigitalAsset: matchedCatalogProd?.type === 'Digital' || !!matchedCatalogProd?.downloadUrl,
            accessModel: trx.accessModel || matchedCatalogProd?.accessModel || 'lifetime',
            durationDays: trx.durationDays || matchedCatalogProd?.durationDays,
            expiryDate: trx.expiryDate || (matchedCatalogProd?.accessModel === 'limited' && matchedCatalogProd?.durationDays 
              ? new Date(new Date(trx.createdAt || Date.now()).getTime() + matchedCatalogProd.durationDays * 86400000).toISOString() 
              : null),
            assetStatus: trx.assetStatus || 'active',
            orderType: trx.orderType || (isServiceProduct(firstItem) || isServiceProduct(matchedCatalogProd) ? 'jasa' : 'beli_putus'),
            paymentScheme: trx.paymentScheme || (trx.paymentStatus === 'dp' ? 'dp' : 'full'),
            dpAmount: trx.dpAmount || (trx.paymentStatus === 'dp' ? Math.round((trx.grandTotal || 0) * 0.5) : 0),
            remainingAmount: trx.remainingAmount || (trx.paymentStatus === 'dp' ? ((trx.grandTotal || 0) - (trx.dpAmount || Math.round((trx.grandTotal || 0) * 0.5))) : 0),
            paymentStatus: trx.paymentStatus,
            milestoneStep: trx.milestoneStep || (trx.paymentStatus === 'lunas' ? 5 : (trx.paymentStatus === 'dp' ? 2 : 1)),
            trackingNumber: trx.trackingNumber || '',
            clientDriveUrl: trx.clientDriveUrl || trx.driveUrl
          });
        }
      });
    }
  } catch (err) {
    console.warn('[clientAuth] Transactions integration error:', err);
  }

  // Interconnection: Also pull from porto_projects matching this client
  try {
    const projectsList = await storage.getItem<any[]>('porto_projects', []);
    if (Array.isArray(projectsList)) {
      const clientEmail = (currentClient?.email || '').trim().toLowerCase();
      const clientPhone = (currentClient?.phone || '').trim();
      const clientName = (currentClient?.name || '').trim().toLowerCase();

      projectsList.forEach((proj: any) => {
        if (!proj || !proj.id) return;
        const pEmail = (proj.clientEmail || proj.customerEmail || '').trim().toLowerCase();
        const pPhone = (proj.clientPhone || proj.customerPhone || '').trim();
        const pName = (proj.clientName || proj.customerName || proj.client || '').trim().toLowerCase();
        const isMatch = (proj.clientId && proj.clientId === clientId) ||
                        (clientEmail && pEmail && pEmail === clientEmail) ||
                        (clientPhone && pPhone && (pPhone === clientPhone || pPhone.replace(/\D/g, '') === clientPhone.replace(/\D/g, ''))) ||
                        (clientName && pName && pName === clientName);

        if (isMatch && !orders.some(o => o.id === proj.id)) {
          const statusMap: Record<string, ClientOrder['status']> = {
            completed: 'Selesai',
            done: 'Selesai',
            in_progress: 'Diproses',
            review: 'Diproses',
            todo: 'Pending',
            planning: 'Pending'
          };
          orders.push({
            id: proj.id,
            clientId: clientId,
            clientName: proj.clientName || proj.customerName || proj.client || currentClient?.name || 'Klien',
            clientPhone: proj.clientPhone || proj.customerPhone || currentClient?.phone || '',
            clientEmail: proj.clientEmail || proj.customerEmail || currentClient?.email || '',
            productName: proj.title || proj.name || 'Proyek Website / Desain Klien',
            productId: proj.id,
            price: proj.budget || proj.price || 0,
            quantity: 1,
            total: proj.budget || proj.price || 0,
            status: statusMap[proj.status] || (proj.progress === 100 ? 'Selesai' : 'Diproses'),
            paymentMethod: 'Kontrak Proyek Agensi',
            notes: proj.description || proj.notes || (proj.driveUrl ? `Drive Proyek: ${proj.driveUrl}` : ''),
            createdAt: proj.createdAt || proj.startDate || new Date().toISOString(),
            downloadUrl: proj.previewUrl || proj.deployUrl || proj.linkUrl || proj.driveUrl || '',
            fileFormat: 'WEB',
            isDigitalAsset: false,
            orderType: 'jasa',
            paymentScheme: proj.paymentScheme || 'dp',
            dpAmount: proj.dpAmount || 0,
            remainingAmount: proj.remainingAmount || 0,
            paymentStatus: proj.paymentStatus || (proj.status === 'completed' ? 'lunas' : 'dp'),
            milestoneStep: proj.milestoneStep || (proj.status === 'completed' ? 5 : (proj.progress ? Math.round(proj.progress / 20) : 2)),
            trackingNumber: proj.trackingNumber || proj.id,
            clientDriveUrl: proj.driveUrl || proj.clientDriveUrl || ''
          });
        }
      });
    }
  } catch (err) {
    console.warn('[clientAuth] Projects integration error:', err);
  }

  // Ensure digital assets have default accessModel and calculate expiry status
  const normalized = orders.map(ord => {
    if (ord.isDigitalAsset || ord.downloadUrl) {
      const model = ord.accessModel || 'lifetime';
      let assetStatus = ord.assetStatus || 'active';
      if (model === 'limited' && ord.expiryDate && assetStatus !== 'revoked') {
        const isExp = new Date(ord.expiryDate).getTime() < Date.now();
        if (isExp) assetStatus = 'expired';
      }
      return {
        ...ord,
        accessModel: model,
        assetStatus
      };
    }
    return ord;
  });

  return normalized.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Update existing order / digital asset license
 */
export async function updateClientOrder(orderId: string, updates: Partial<ClientOrder>): Promise<void> {
  // 1. Update Firestore porto_orders if exists (direct doc ID or orderId field)
  try {
    const orderRef = doc(db, 'porto_orders', orderId);
    const snap = await getDoc(orderRef);
    if (snap.exists()) {
      await updateDoc(orderRef, updates as any);
    }
  } catch (e) {
    // Continue
  }

  try {
    // Also query by orderId field (e.g. when orderId is the transaction ID from CartCheckout)
    const q = query(collection(db, 'porto_orders'), where('orderId', '==', orderId));
    const qSnap = await getDocs(q);
    if (!qSnap.empty) {
      await Promise.all(qSnap.docs.map(d => updateDoc(d.ref, updates as any)));
    }
  } catch (e) {
    // Continue
  }

  // 2. Update local storage porto_client_orders (both matching id or orderId)
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (raw) {
      const list: ClientOrder[] = JSON.parse(raw);
      let changed = false;
      const updatedList = list.map(o => {
        if (o.id === orderId || (o as any).orderId === orderId) {
          changed = true;
          return { ...o, ...updates };
        }
        return o;
      });
      if (changed) {
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updatedList));
      }
    }
  } catch (_) {}

  // 3. Update storage porto_transactions if matching
  try {
    const trxs = await storage.getItem<any[]>('porto_transactions', []);
    if (Array.isArray(trxs)) {
      const tIdx = trxs.findIndex((t: any) => t.id === orderId);
      if (tIdx !== -1) {
        trxs[tIdx] = { ...trxs[tIdx], ...updates };
        await storage.setItem('porto_transactions', trxs);
      }
    }
  } catch (_) {}

  window.dispatchEvent(new CustomEvent('porto_orders_updated', { detail: { orderId, updates } }));
}

/**
 * Admin: Grant/Gift digital asset directly to client
 */
export async function grantClientAsset(params: {
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  productName: string;
  downloadUrl: string;
  fileFormat?: string;
  fileSize?: string;
  instantDeliveryMessage?: string;
  accessModel?: 'lifetime' | 'limited';
  durationDays?: number;
  expiryDate?: string | null;
}): Promise<ClientOrder> {
  const isLimited = params.accessModel === 'limited';
  let expiry = params.expiryDate;
  if (isLimited && !expiry && params.durationDays) {
    const d = new Date();
    d.setDate(d.getDate() + params.durationDays);
    expiry = d.toISOString();
  }

  const orderData: Omit<ClientOrder, 'id' | 'createdAt'> = {
    clientId: params.clientId,
    clientName: params.clientName,
    clientEmail: params.clientEmail,
    clientPhone: params.clientPhone,
    productName: params.productName,
    price: 0,
    quantity: 1,
    total: 0,
    status: 'Selesai',
    paymentMethod: 'Hibah Admin (Khusus)',
    notes: 'Aset digital diberikan langsung oleh administrator',
    downloadUrl: params.downloadUrl,
    fileFormat: params.fileFormat || 'ZIP',
    fileSize: params.fileSize || '',
    instantDeliveryMessage: params.instantDeliveryMessage || '',
    isDigitalAsset: true,
    accessModel: params.accessModel || 'lifetime',
    durationDays: params.durationDays,
    expiryDate: isLimited ? expiry : null,
    assetStatus: 'active'
  };

  return await saveClientOrder(orderData);
}

/**
 * Save new order for client
 */
export async function saveClientOrder(orderData: Omit<ClientOrder, 'id' | 'createdAt'>): Promise<ClientOrder> {
  const orderId = 'ord_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  const nowStr = new Date().toISOString();

  const newOrder: ClientOrder = {
    id: orderId,
    ...orderData,
    createdAt: nowStr,
  };

  // 1. Save to Firestore
  try {
    await setDoc(doc(db, 'porto_orders', orderId), {
      ...newOrder,
      createdAtServer: serverTimestamp(),
    });
  } catch (e) {
    console.warn('[clientAuth] Firestore save order warning:', e);
  }

  // 2. Save to local storage & IndexedDB
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    const list: ClientOrder[] = raw ? JSON.parse(raw) : [];
    list.unshift(newOrder);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list.slice(0, 100)));
    storage.setItem('porto_client_orders', list, true).catch(() => {});
  } catch (_) {}

  return newOrder;
}

/**
 * Look up orders by query string (Order ID, phone, or email)
 * Allows guest clients to track project / order status without login.
 */
export async function lookupClientOrder(queryTerm: string): Promise<ClientOrder[]> {
  const rawQ = (queryTerm || '').trim().toLowerCase();
  if (!rawQ) return [];

  const q = rawQ.replace(/^#+/, '').trim();
  const cleanDigits = rawQ.replace(/\D/g, '');
  const results: ClientOrder[] = [];

  // 1. Check local orders (porto_client_orders)
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (raw) {
      const localOrders: ClientOrder[] = JSON.parse(raw);
      localOrders.forEach(o => {
        const idMatch = o.id.toLowerCase().includes(q) || o.id.toLowerCase().includes(rawQ);
        const emailMatch = (o.clientEmail || '').toLowerCase().includes(q);
        const nameMatch = (o.clientName || '').toLowerCase().includes(q);
        const phoneDigits = (o.clientPhone || '').replace(/\D/g, '');
        const phoneMatch = cleanDigits.length >= 4 && phoneDigits.includes(cleanDigits);

        if (idMatch || emailMatch || nameMatch || phoneMatch) {
          if (!results.some(r => r.id === o.id)) {
            results.push(o);
          }
        }
      });
    }
  } catch (_) {}

  // 2. Check storage transactions (porto_transactions)
  try {
    const [trxList, catalogList] = await Promise.all([
      storage.getItem('porto_transactions', []),
      storage.getItem('porto_catalog_products', [])
    ]);
    if (Array.isArray(trxList)) {
      trxList.forEach((trx: any) => {
        if (!trx || !trx.id) return;
        const cust = trx.customer || {};
        const custEmail = (cust.email || '').toLowerCase();
        const custName = (cust.name || '').toLowerCase();
        const custPhoneDigits = (cust.phone || '').replace(/\D/g, '');

        const idMatch = trx.id.toLowerCase().includes(q) || 
          trx.id.toLowerCase().includes(rawQ) || 
          (trx.invoiceNumber && trx.invoiceNumber.toLowerCase().includes(q));
        const emailMatch = custEmail && custEmail.includes(q);
        const nameMatch = custName && custName.includes(q);
        const phoneMatch = cleanDigits.length >= 4 && custPhoneDigits.includes(cleanDigits);

        if (idMatch || emailMatch || nameMatch || phoneMatch) {
          if (!results.some(r => r.id === trx.id)) {
            const statusMap: Record<string, ClientOrder['status']> = {
              lunas: 'Selesai',
              dp: 'Diproses',
              belum: 'Pending',
              quotation: 'Pending',
            };
            const itemSummary = (trx.items || []).map((i: any) => `${i.name || 'Produk'}${i.qty > 1 ? ` (x${i.qty})` : ''}`).join(', ') || 'Transaksi Agensi';
            const firstItem = (trx.items && trx.items[0]) || {};
            const matchedCatalogProd = Array.isArray(catalogList) ? catalogList.find((p: any) => p.id === firstItem.id || p.id === firstItem.productId) : null;

            results.push({
              id: trx.id,
              clientId: cust.clientId || 'guest',
              clientName: cust.name || 'Klien',
              clientPhone: cust.phone || '',
              clientEmail: cust.email || '',
              productName: itemSummary,
              productId: firstItem.id || firstItem.productId,
              price: trx.grandTotal || 0,
              quantity: 1,
              total: trx.grandTotal || 0,
              status: statusMap[trx.paymentStatus] || 'Pending',
              paymentMethod: trx.paymentMethod?.bankName || (trx.paymentStatus === 'lunas' ? 'Lunas' : 'Invoice Agensi'),
              notes: trx.notes || (trx.driveUrl ? `Nota PDF: ${trx.driveUrl}` : ''),
              createdAt: trx.createdAt || trx.date || new Date().toISOString(),
              downloadUrl: matchedCatalogProd?.downloadUrl || firstItem.downloadUrl,
              fileFormat: matchedCatalogProd?.fileFormat || 'ZIP',
              fileSize: matchedCatalogProd?.fileSize || '',
              instantDeliveryMessage: matchedCatalogProd?.instantDeliveryMessage || '',
              isDigitalAsset: matchedCatalogProd?.type === 'Digital' || !!matchedCatalogProd?.downloadUrl,
              orderType: trx.orderType || (isServiceProduct(firstItem) || isServiceProduct(matchedCatalogProd) ? 'jasa' : 'beli_putus'),
              paymentScheme: trx.paymentScheme || (trx.paymentStatus === 'dp' ? 'dp' : 'full'),
              dpAmount: trx.dpAmount || (trx.paymentStatus === 'dp' ? Math.round((trx.grandTotal || 0) * 0.5) : 0),
              remainingAmount: trx.remainingAmount || (trx.paymentStatus === 'dp' ? ((trx.grandTotal || 0) - (trx.dpAmount || Math.round((trx.grandTotal || 0) * 0.5))) : 0),
              paymentStatus: trx.paymentStatus,
              milestoneStep: trx.milestoneStep !== undefined ? trx.milestoneStep : (trx.paymentStatus === 'lunas' ? 5 : (trx.paymentStatus === 'dp' ? 2 : 1)),
              trackingNumber: trx.trackingNumber || '',
              clientDriveUrl: trx.clientDriveUrl || trx.driveUrl
            });
          }
        }
      });
    }
  } catch (_) {}

  // 3. Check projects (porto_projects)
  try {
    const projectsList = await storage.getItem<any[]>('porto_projects', []);
    if (Array.isArray(projectsList)) {
      projectsList.forEach((proj: any) => {
        if (!proj || !proj.id) return;
        const pEmail = (proj.clientEmail || proj.customerEmail || '').toLowerCase();
        const pName = (proj.clientName || proj.customerName || proj.client || '').toLowerCase();
        const pPhoneDigits = (proj.clientPhone || proj.customerPhone || '').replace(/\D/g, '');
        const pTracking = (proj.trackingNumber || '').toLowerCase();

        const idMatch = proj.id.toLowerCase().includes(q) || proj.id.toLowerCase().includes(rawQ);
        const trackingMatch = pTracking && (pTracking.includes(q) || pTracking.includes(rawQ));
        const emailMatch = pEmail && pEmail.includes(q);
        const nameMatch = pName && pName.includes(q);
        const phoneMatch = cleanDigits.length >= 4 && pPhoneDigits.includes(cleanDigits);

        if (idMatch || trackingMatch || emailMatch || nameMatch || phoneMatch) {
          if (!results.some(r => r.id === proj.id)) {
            const statusMap: Record<string, ClientOrder['status']> = {
              completed: 'Selesai',
              done: 'Selesai',
              in_progress: 'Diproses',
              review: 'Diproses',
              todo: 'Pending',
              planning: 'Pending'
            };
            results.push({
              id: proj.id,
              clientId: proj.clientId || 'guest',
              clientName: proj.clientName || proj.customerName || proj.client || 'Klien',
              clientPhone: proj.clientPhone || proj.customerPhone || '',
              clientEmail: proj.clientEmail || proj.customerEmail || '',
              productName: proj.title || proj.name || 'Proyek Website / Desain Klien',
              productId: proj.id,
              price: proj.budget || proj.price || 0,
              quantity: 1,
              total: proj.budget || proj.price || 0,
              status: statusMap[proj.status] || (proj.progress === 100 ? 'Selesai' : 'Diproses'),
              paymentMethod: 'Kontrak Proyek Agensi',
              notes: proj.description || proj.notes || (proj.driveUrl ? `Drive Proyek: ${proj.driveUrl}` : ''),
              createdAt: proj.createdAt || proj.startDate || new Date().toISOString(),
              downloadUrl: proj.previewUrl || proj.deployUrl || proj.linkUrl || proj.driveUrl || '',
              fileFormat: 'WEB',
              isDigitalAsset: false,
              orderType: 'jasa',
              paymentScheme: proj.paymentScheme || 'dp',
              dpAmount: proj.dpAmount || 0,
              remainingAmount: proj.remainingAmount || 0,
              paymentStatus: proj.paymentStatus || (proj.status === 'completed' ? 'lunas' : 'dp'),
              milestoneStep: proj.milestoneStep || (proj.status === 'completed' ? 5 : (proj.progress ? Math.round(proj.progress / 20) : 2)),
              trackingNumber: proj.trackingNumber || proj.id,
              clientDriveUrl: proj.driveUrl || proj.clientDriveUrl || ''
            });
          }
        }
      });
    }
  } catch (_) {}

  // 4. Try Firestore if online
  try {
    const qDoc = doc(db, 'porto_orders', queryTerm.trim());
    const snap = await getDoc(qDoc);
    if (snap.exists() && !results.some(r => r.id === snap.id)) {
      results.push({ id: snap.id, ...(snap.data() as any) });
    }
  } catch (_) {}

  return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
