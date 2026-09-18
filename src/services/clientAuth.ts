import { db } from '../firebase';
import { doc, getDoc, setDoc, getDocs, collection, query, where, serverTimestamp, updateDoc } from 'firebase/firestore';
import { storage } from '../utils/storage';

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
}

const LOCAL_CLIENT_KEY = 'porto_current_client';
const LOCAL_CLIENTS_STORE = 'porto_clients_cache';
const LOCAL_ORDERS_KEY = 'porto_client_orders';

// Simple fast hash for local client password storage
const hashSecret = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'pw_' + Math.abs(hash).toString(36) + '_' + str.length;
};

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
  const passwordHash = hashSecret(params.password);
  const rawPassword = params.password;
  const nowStr = new Date().toISOString();

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

    // Save to Firestore with rawPassword for admin recovery
    await setDoc(doc(db, 'porto_clients', clientId), {
      ...newClient,
      passwordHash,
      rawPassword,
      createdAtServer: serverTimestamp(),
    });
  } catch (err: any) {
    if (err.message && err.message.includes('sudah terdaftar')) throw err;
    console.warn('[clientAuth] Firestore offline or permission denied, using local cache:', err);
  }

  // Save to local cache with rawPassword
  localDb[clientId] = { ...newClient, passwordHash, rawPassword };
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
  const passwordHash = hashSecret(password);
  const nowStr = new Date().toISOString();

  let matchedClient: (ClientUser & { passwordHash?: string }) | null = null;

  // 1. Try checking Firestore
  try {
    const q = query(collection(db, 'porto_clients'), where('email', '==', normalizedEmail));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data() as any;
      if (docData.passwordHash === passwordHash) {
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

        // Update last login
        updateDoc(doc(db, 'porto_clients', snapshot.docs[0].id), {
          lastLoginAt: nowStr,
        }).catch(() => {});
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
      if (found.passwordHash === passwordHash) {
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

  // Update session & cache
  localStorage.setItem(LOCAL_CLIENT_KEY, JSON.stringify(matchedClient));
  const localDb = getLocalClients();
  localDb[matchedClient.id] = { ...localDb[matchedClient.id], ...matchedClient, passwordHash };
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

/**
 * Update Client Profile
 */
export async function updateClientProfile(params: {
  name: string;
  phone?: string;
  avatar?: string;
}): Promise<ClientUser> {
  const current = getCurrentClient();
  if (!current) throw new Error('Anda belum login.');

  const updated: ClientUser = {
    ...current,
    name: params.name.trim(),
    phone: params.phone !== undefined ? params.phone.trim() : current.phone,
    avatar: params.avatar || current.avatar,
  };

  // 1. Update Firestore
  try {
    await updateDoc(doc(db, 'porto_clients', current.id), {
      name: updated.name,
      phone: updated.phone || '',
      avatar: updated.avatar,
    });
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
 * Change Client Password
 */
export async function changeClientPassword(oldPassword: string, newPassword: string): Promise<void> {
  const current = getCurrentClient();
  if (!current) throw new Error('Anda belum login.');

  const oldHash = hashSecret(oldPassword);
  const newHash = hashSecret(newPassword);

  let verified = false;

  // 1. Check Firestore
  try {
    const docSnap = await getDoc(doc(db, 'porto_clients', current.id));
    if (docSnap.exists()) {
      if (docSnap.data().passwordHash === oldHash) {
        verified = true;
        await updateDoc(doc(db, 'porto_clients', current.id), {
          passwordHash: newHash,
          rawPassword: newPassword,
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
    if (localDb[current.id].passwordHash === oldHash || !verified) {
      if (localDb[current.id].passwordHash && localDb[current.id].passwordHash !== oldHash) {
        throw new Error('Kata sandi lama yang Anda masukkan tidak sesuai.');
      }
      localDb[current.id].passwordHash = newHash;
      localDb[current.id].rawPassword = newPassword;
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
            isDigitalAsset: matchedCatalogProd?.type === 'Digital' || !!matchedCatalogProd?.downloadUrl
          });
        }
      });
    }
  } catch (err) {
    console.warn('[clientAuth] Transactions integration error:', err);
  }

  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  // 2. Save to local storage
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    const list: ClientOrder[] = raw ? JSON.parse(raw) : [];
    list.unshift(newOrder);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
  } catch (_) {}

  return newOrder;
}
