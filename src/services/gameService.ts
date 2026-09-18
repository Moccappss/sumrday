import { db } from '../firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
  query, where, orderBy, onSnapshot 
} from 'firebase/firestore';
import { GameInstance, ClientGameLicense } from '../types/gameLicense';
import { SAMPLE_GAMES } from '../data/sampleGames';
import { storage } from '../utils/storage';

const GAMES_COLLECTION = 'custom_games';
const LICENSES_COLLECTION = 'game_licenses';
export const STORAGE_GAMES_KEY = 'porto_custom_games';
export const STORAGE_LICENSES_KEY = 'porto_game_licenses';

/**
 * Service Game Master — Mengikuti arsitektur website utama (Offline-First Hybrid Storage)
 * Data tersimpan di IndexedDB lokal berkecepatan 0ms dan tersinkronisasi ke Firestore Cloud.
 */

export const getGames = async (): Promise<GameInstance[]> => {
  try {
    // 1. Cek storage lokal (IndexedDB) terlebih dahulu sesuai arsitektur website utama
    const cached = await storage.getItem<GameInstance[]>(STORAGE_GAMES_KEY, null);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }

    // 2. Fallback baca langsung dari Firestore jika cache lokal kosong
    const q = query(collection(db, GAMES_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const cloudGames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameInstance));
    if (cloudGames.length > 0) {
      await storage.setItem(STORAGE_GAMES_KEY, cloudGames, false);
    }
    return cloudGames;
  } catch (error) {
    console.error('Error fetching games:', error);
    // Fallback safe return from local storage
    const fallback = await storage.getItem<GameInstance[]>(STORAGE_GAMES_KEY, []);
    return fallback || [];
  }
};

export const subscribeToGames = (callback: (games: GameInstance[]) => void) => {
  // Langsung panggil callback dengan data cache lokal tercepat
  storage.getItem<GameInstance[]>(STORAGE_GAMES_KEY, []).then(local => {
    if (Array.isArray(local) && local.length > 0) {
      callback(local);
    }
  }).catch(() => {});

  // Listen perubahan lokal (melalui event storage website utama)
  const unsubStorage = storage.listenItem(STORAGE_GAMES_KEY, (val) => {
    if (Array.isArray(val)) {
      callback(val);
    }
  }, []);

  // Listen perubahan dari Firestore collection secara real-time
  const q = query(collection(db, GAMES_COLLECTION), orderBy('createdAt', 'desc'));
  const unsubFirestore = onSnapshot(q, (snapshot) => {
    const cloudGames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameInstance));
    // Simpan ke storage lokal website utama agar konsisten
    storage.setItem(STORAGE_GAMES_KEY, cloudGames, false).catch(() => {});
    callback(cloudGames);
  }, (err) => {
    console.warn('Firestore games listener error, running from local storage:', err);
  });

  return () => {
    unsubStorage();
    unsubFirestore();
  };
};

export const seedSampleGames = async (): Promise<void> => {
  const now = Date.now();
  const seededList: GameInstance[] = [];

  for (let i = 0; i < SAMPLE_GAMES.length; i++) {
    const sample = SAMPLE_GAMES[i];
    const id = sample.id || `sample_game_${i + 1}`;
    const gameRef = doc(db, GAMES_COLLECTION, id);
    const payload: GameInstance = {
      id,
      title: sample.title || 'Sample Game',
      slug: sample.slug || id,
      description: sample.description || '',
      thumbnailUrl: sample.thumbnailUrl || '',
      previewVideoUrl: sample.previewVideoUrl || '',
      engineType: sample.engineType || 'HTML5 Single File (Event Activation)',
      category: sample.category || 'Event',
      tags: sample.tags || [],
      pricingTier: sample.pricingTier || 'basic',
      eventSpecs: sample.eventSpecs || {
        estimatedDuration: '30 - 60 Detik / Pemain',
        leaderboardCapacity: 'Top 10 Peserta',
        deviceSupport: 'Touchscreen Kiosk & Smartphone'
      },
      inputSpecs: sample.inputSpecs || {
        requireCamera: false,
        requireMicrophone: false,
        requireTouchTap: true,
        requireKeyboard: false,
        sessionDurationSec: 45,
        maxTargetScore: 1000,
        instructionText: 'Tap atau sentuh layar untuk mengumpulkan poin tertinggi!'
      },
      defaultConfig: sample.defaultConfig || {
        themeColor: '#7c3aed',
        title: sample.title || 'Sample Game'
      },
      createdAt: now - (i * 1000 * 60 * 60),
      updatedAt: now,
      isActive: true
    };

    await setDoc(gameRef, payload, { merge: true });
    seededList.push(payload);
  }

  // Sinkronisasi ke storage lokal website utama
  const currentLocal = (await storage.getItem<GameInstance[]>(STORAGE_GAMES_KEY, [])) || [];
  const mergedMap = new Map<string, GameInstance>();
  currentLocal.forEach(g => mergedMap.set(g.id, g));
  seededList.forEach(g => mergedMap.set(g.id, g));
  await storage.setItem(STORAGE_GAMES_KEY, Array.from(mergedMap.values()), true);
};

export const saveGameInstance = async (game: Partial<GameInstance>): Promise<string> => {
  const id = game.id || `game_${Date.now()}`;
  const now = Date.now();
  const gameRef = doc(db, GAMES_COLLECTION, id);

  const payload: GameInstance = {
    id,
    title: game.title || 'Untitled Game',
    slug: game.slug || id.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    description: game.description || '',
    thumbnailUrl: game.thumbnailUrl || '',
    previewVideoUrl: game.previewVideoUrl || '',
    engineType: game.engineType || 'HTML5 Single File (Event Activation)',
    category: game.category || 'Event',
    tags: game.tags || [],
    pricingTier: game.pricingTier || 'basic',
    eventSpecs: game.eventSpecs || {
      estimatedDuration: '30 - 60 Detik / Pemain',
      leaderboardCapacity: 'Top 10 Peserta',
      deviceSupport: 'Touchscreen Kiosk & Smartphone'
    },
    inputSpecs: game.inputSpecs || {
      requireCamera: false,
      requireMicrophone: false,
      requireTouchTap: true,
      requireKeyboard: false,
      sessionDurationSec: 45,
      maxTargetScore: 1000,
      instructionText: 'Tap layar untuk bermain!'
    },
    defaultConfig: game.defaultConfig || {
      themeColor: '#7c3aed',
      title: game.title || 'Game Baru'
    },
    createdAt: game.createdAt || now,
    updatedAt: now,
    isActive: game.isActive !== undefined ? game.isActive : true,
  };

  // 1. Simpan ke Firestore (Dedicated Collection)
  await setDoc(gameRef, payload, { merge: true });

  // 2. Simpan ke storage lokal website utama (IndexedDB + Partition Map)
  try {
    const localGames = (await storage.getItem<GameInstance[]>(STORAGE_GAMES_KEY, [])) || [];
    const idx = localGames.findIndex(g => g.id === id);
    let updated: GameInstance[];
    if (idx >= 0) {
      updated = [...localGames];
      updated[idx] = payload;
    } else {
      updated = [payload, ...localGames];
    }
    await storage.setItem(STORAGE_GAMES_KEY, updated, true);
  } catch (err) {
    console.warn('[GameService] Error updating local storage for game:', err);
  }

  return id;
};

export const deleteGameInstance = async (id: string): Promise<void> => {
  // 1. Hapus dari Firestore
  await deleteDoc(doc(db, GAMES_COLLECTION, id));

  // 2. Hapus dari storage lokal website utama
  try {
    const localGames = (await storage.getItem<GameInstance[]>(STORAGE_GAMES_KEY, [])) || [];
    const updated = localGames.filter(g => g.id !== id);
    await storage.setItem(STORAGE_GAMES_KEY, updated, true);
  } catch (err) {
    console.warn('[GameService] Error updating local storage on delete:', err);
  }
};

/**
 * Service Lisensi Klien (Manajemen Model Sewa / Beli Putus & Tier)
 */

export const getLicenses = async (): Promise<ClientGameLicense[]> => {
  try {
    const cached = await storage.getItem<ClientGameLicense[]>(STORAGE_LICENSES_KEY, null);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
    const q = query(collection(db, LICENSES_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientGameLicense));
    if (list.length > 0) {
      await storage.setItem(STORAGE_LICENSES_KEY, list, false);
    }
    return list;
  } catch (error) {
    console.error('Error fetching licenses:', error);
    const fallback = await storage.getItem<ClientGameLicense[]>(STORAGE_LICENSES_KEY, []);
    return fallback || [];
  }
};

export const subscribeToLicenses = (callback: (licenses: ClientGameLicense[]) => void) => {
  // Ambil data lokal tercepat
  storage.getItem<ClientGameLicense[]>(STORAGE_LICENSES_KEY, []).then(local => {
    if (Array.isArray(local) && local.length > 0) {
      callback(local);
    }
  }).catch(() => {});

  const unsubStorage = storage.listenItem(STORAGE_LICENSES_KEY, (val) => {
    if (Array.isArray(val)) {
      callback(val);
    }
  }, []);

  const q = query(collection(db, LICENSES_COLLECTION), orderBy('createdAt', 'desc'));
  const unsubFirestore = onSnapshot(q, (snapshot) => {
    const licenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientGameLicense));
    storage.setItem(STORAGE_LICENSES_KEY, licenses, false).catch(() => {});
    callback(licenses);
  }, (err) => {
    console.warn('Firestore licenses listener error:', err);
  });

  return () => {
    unsubStorage();
    unsubFirestore();
  };
};

export const saveClientLicense = async (license: Partial<ClientGameLicense>): Promise<string> => {
  const now = Date.now();
  const clientId = license.clientId || '';
  const gameId = license.gameId || '';
  const cleanClientId = clientId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const id = license.id || (cleanClientId ? `${cleanClientId}_${gameId}_${Date.now().toString(36)}` : `link_${gameId}_${Date.now().toString(36)}`);

  const licenseRef = doc(db, LICENSES_COLLECTION, id);

  const payload: ClientGameLicense = {
    id,
    clientId,
    clientEmail: license.clientEmail || '',
    clientName: license.clientName || 'Klien sumr.day',
    customTitle: license.customTitle || license.customConfig?.title || '',
    gameId,
    gameTitle: license.gameTitle || 'Game',
    model: license.model || 'rental',
    tier: license.tier || 'view_only',
    adminRole: license.adminRole || (license.tier === 'view_only' ? 'view_only' : license.tier === 'plus' ? 'supplier' : 'master'),
    startDate: license.startDate || now,
    expiryDate: license.model === 'lifetime' ? null : (license.expiryDate || (now + 30 * 24 * 60 * 60 * 1000)),
    status: license.status || 'active',
    customConfig: license.customConfig || {},
    createdAt: license.createdAt || now,
    updatedAt: now,
  };

  await setDoc(licenseRef, payload, { merge: true });

  try {
    const local = (await storage.getItem<ClientGameLicense[]>(STORAGE_LICENSES_KEY, [])) || [];
    const idx = local.findIndex(l => l.id === id);
    let updated: ClientGameLicense[];
    if (idx >= 0) {
      updated = [...local];
      updated[idx] = payload;
    } else {
      updated = [payload, ...local];
    }
    await storage.setItem(STORAGE_LICENSES_KEY, updated, true);
  } catch (err) {
    console.warn('[GameService] Error saving license to local storage:', err);
  }

  return id;
};

export const deleteClientLicense = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, LICENSES_COLLECTION, id));
  try {
    const local = (await storage.getItem<ClientGameLicense[]>(STORAGE_LICENSES_KEY, [])) || [];
    const updated = local.filter(l => l.id !== id);
    await storage.setItem(STORAGE_LICENSES_KEY, updated, true);
  } catch (err) {
    console.warn('[GameService] Error deleting license from local storage:', err);
  }
};

/**
 * Fungsi Ambil Lisensi Spesifik Klien (Untuk 1x Read Firestore saat login)
 */
export const fetchClientLicensesFromFirestore = async (clientId: string, clientEmail?: string): Promise<ClientGameLicense[]> => {
  try {
    if (!clientId && !clientEmail) return [];
    
    // Ambil lisensi berdasarkan clientId
    const q1 = query(collection(db, LICENSES_COLLECTION), where('clientId', '==', clientId));
    const snap1 = await getDocs(q1);
    const results: ClientGameLicense[] = snap1.docs.map(d => ({ id: d.id, ...d.data() } as ClientGameLicense));

    // Fallback jika klien dicatat berdasarkan email
    if (clientEmail) {
      const q2 = query(collection(db, LICENSES_COLLECTION), where('clientEmail', '==', clientEmail));
      const snap2 = await getDocs(q2);
      snap2.docs.forEach(d => {
        if (!results.some(r => r.id === d.id)) {
          results.push({ id: d.id, ...d.data() } as ClientGameLicense);
        }
      });
    }

    return results;
  } catch (error) {
    console.error('Error fetching client licenses from Firestore:', error);
    return [];
  }
};
