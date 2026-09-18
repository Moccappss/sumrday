/**
 * notifications.js — Realtime Cloud-Synced Notification Engine
 * Menyinkronkan notifikasi per-save file, pesan masuk, dan aktivitas proyek antar akun & multi-device secara realtime via Firestore.
 */

import { db, auth } from '../firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

export const NOTIF_TYPES = {
  CHAT:        'chat',
  FORM:        'form',
  SYSTEM:      'system',
  TRANSACTION: 'transaction',
  SAVE:        'save',
  PAGE:        'page',
  BLOCK:       'block',
  SETTINGS:    'settings',
  WARNING:     'warning',
  ERROR:       'error',
  SUCCESS:     'success',
  PROJECT:     'project',
  REMOTE_EDIT: 'remote_edit',
};

const STORAGE_KEY = 'porto_admin_notifications';
const READ_STATUS_KEY = 'porto_admin_read_notif_ids';

const getCurrentUserId = () => {
  if (typeof window === 'undefined') return 'anonymous';
  return auth?.currentUser?.uid || localStorage.getItem('porto_active_uid') || 'admin';
};

const getCurrentUserName = () => {
  if (typeof window === 'undefined') return 'Admin';
  return auth?.currentUser?.displayName || auth?.currentUser?.email?.split('@')[0] || 'Admin';
};

const getLocalReadIds = () => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(READ_STATUS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

const addLocalReadId = (id) => {
  if (typeof window === 'undefined' || !id) return;
  try {
    const readIds = getLocalReadIds();
    readIds.add(id);
    localStorage.setItem(READ_STATUS_KEY, JSON.stringify(Array.from(readIds).slice(-200)));
  } catch {
    // Ignore storage quota error
  }
};

const getLocalNotifs = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const readIds = getLocalReadIds();
    return list.map(n => ({
      ...n,
      read: n.read || readIds.has(n.id) || (Array.isArray(n.readBy) && n.readBy.includes(getCurrentUserId()))
    }));
  } catch {
    return [];
  }
};

const setLocalNotifs = (list) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 60)));
    window.dispatchEvent(new CustomEvent('porto_admin_notifs_changed', { detail: list }));
    const unread = list.filter(n => !n.read).length;
    window.dispatchEvent(new CustomEvent('porto_notif_count', { detail: unread }));
  } catch {
    // Ignore storage quota error
  }
};

/* ── Audio: Silent ── */
export const playNotificationSound = () => {};

/* ── Native browser notification ── */
export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  try {
    if (Notification.permission === 'default') return await Notification.requestPermission();
    return Notification.permission;
  } catch { return 'denied'; }
};

export const sendNativeNotification = (title, options = {}) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    const notifOptions = {
      body: options.body || '',
      icon: options.icon || '/favicon.svg',
      badge: options.badge || '/favicon.svg',
      image: options.image || undefined,
      tag: options.tag || `porto-broadcast-${Date.now()}`,
      renotify: true,
      data: options.data || { url: options.url || '/' }
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        if (reg && reg.showNotification) {
          reg.showNotification(title, notifOptions).catch(() => {});
        }
      }).catch(() => {});
    }

    const notif = new Notification(title, notifOptions);
    notif.onclick = (e) => {
      e.preventDefault();
      window.focus();
      const targetUrl = options.url || options.data?.url;
      if (targetUrl) {
        if (targetUrl.startsWith('http')) {
          window.open(targetUrl, '_blank');
        } else {
          window.location.href = targetUrl;
        }
      }
      notif.close();
    };
    return notif;
  } catch (err) {
    console.warn('[Push] Native notification error:', err);
    return null;
  }
};

/* ── Core Notification Dispatcher (Realtime Cloud-Synced) ── */
export const addNotification = async (dataOrType = {}, title = '', message = '', extraData = {}) => {
  try {
    let payload = {};
    if (typeof dataOrType === 'string') {
      payload = {
        type: dataOrType,
        title: title || 'Pemberitahuan',
        message: message || 'Pembaruan berhasil dicatat.',
        data: extraData || {}
      };
    } else if (dataOrType && typeof dataOrType === 'object') {
      payload = dataOrType;
    }

    const currentUid = getCurrentUserId();
    const currentUserName = getCurrentUserName();
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const newNotif = {
      id: notifId,
      type: payload.type || NOTIF_TYPES.SAVE,
      title: payload.title || 'Pembaruan Tersimpan',
      message: payload.message || 'File berhasil diperbarui.',
      data: payload.data || {},
      authorId: currentUid,
      authorName: currentUserName,
      authorEmail: auth?.currentUser?.email || '',
      read: false,
      readBy: [], // Array ID akun yang sudah membaca
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };

    // 1. Update Local Cache
    const current = getLocalNotifs();
    const updated = [newNotif, ...current.filter(n => n.id !== newNotif.id)].slice(0, 60);
    setLocalNotifs(updated);

    // 2. Sync to Cloud Firestore hanya jika dalam mode hybrid
    const currentEngine = typeof localStorage !== 'undefined' ? (localStorage.getItem('porto_storage_engine') || 'drive_first') : 'drive_first';
    if (db && currentEngine === 'hybrid') {
      setDoc(doc(db, 'porto_notifications', notifId), newNotif).catch((err) => {
        console.warn('[Notifications] Firestore sync fallback:', err.message);
      });
    }
  } catch (e) {
    console.error('[Notifications] Failed to add notification:', e);
  }
};

/* ── Helper Functions: Per-Save File & Action ── */

// 1. Pesan Masuk / Chat
export const notifyChat = (senderName = 'Pengunjung', previewText = '') => {
  return addNotification({
    type: NOTIF_TYPES.CHAT,
    title: 'Pesan Masuk Baru',
    message: previewText ? `${senderName}: "${previewText.slice(0, 65)}${previewText.length > 65 ? '...' : ''}"` : `Ada pesan baru dari ${senderName}.`,
    data: { sender: senderName }
  });
};

// 2. Halaman Builder
export const notifySave = (pageName = 'Halaman') => {
  return addNotification({
    type: NOTIF_TYPES.SAVE,
    title: 'Halaman Disimpan',
    message: `Pembaruan data untuk "${pageName}" berhasil disimpan ke sistem.`,
    data: { page: pageName }
  });
};

// 3. Blog Artikel
export const notifyBlog = (postTitle = 'Artikel Blog', action = 'disimpan') => {
  return addNotification({
    type: NOTIF_TYPES.PAGE,
    title: `Artikel Blog ${action === 'dibuat' ? 'Dibuat' : 'Disimpan'}`,
    message: `Artikel "${postTitle}" berhasil ${action}.`,
    data: { title: postTitle, action }
  });
};

// 4. Karya / Portofolio
export const notifyPortfolio = (itemTitle = 'Item Karya', action = 'disimpan') => {
  return addNotification({
    type: NOTIF_TYPES.PROJECT,
    title: `Karya Portofolio ${action === 'dibuat' ? 'Dibuat' : 'Disimpan'}`,
    message: `Karya "${itemTitle}" berhasil ${action} ke galeri.`,
    data: { title: itemTitle, action }
  });
};

// 5. Proyek & Tugas (Project Module)
export const notifyProject = (projectTitle = 'Proyek', action = 'disimpan') => {
  return addNotification({
    type: NOTIF_TYPES.PROJECT,
    title: `Proyek ${action === 'dibuat' ? 'Dibuat' : 'Diperbarui'}`,
    message: `Proyek "${projectTitle}" telah ${action}.`,
    data: { projectTitle, action }
  });
};

// 6. Notes / Memo / Dokumen
export const notifyNote = (noteTitle = 'Catatan', action = 'disimpan') => {
  return addNotification({
    type: NOTIF_TYPES.SAVE,
    title: `Catatan ${action === 'dibuat' ? 'Dibuat' : 'Disimpan'}`,
    message: `Dokumen catatan "${noteTitle}" berhasil ${action}.`,
    data: { noteTitle, action }
  });
};

// 7. Katalog & Layanan
export const notifyCatalog = (productName = 'Item Katalog', action = 'disimpan') => {
  return addNotification({
    type: NOTIF_TYPES.PAGE,
    title: `Katalog ${action === 'dibuat' ? 'Dibuat' : 'Disimpan'}`,
    message: `Layanan/produk "${productName}" berhasil ${action}.`,
    data: { productName, action }
  });
};

// 8. Transaksi & Pesanan Masuk
export const notifyTransaction = (orderId = '', total = '', customerName = '') => {
  return addNotification({
    type: NOTIF_TYPES.TRANSACTION,
    title: 'Pesanan / Transaksi Baru',
    message: customerName 
      ? `Pesanan #${orderId || ''} dari ${customerName} (${total || ''}) telah dicatat.`
      : `Transaksi #${orderId || ''} berhasil disimpan (${total || ''}).`,
    data: { orderId, total, customerName }
  });
};

// 9. Pengaturan (Settings, Links, Branding)
export const notifySettings = (category = 'Pengaturan') => {
  return addNotification({
    type: NOTIF_TYPES.SETTINGS,
    title: 'Pengaturan Disimpan',
    message: `${category} berhasil diperbarui ke sistem.`,
    data: { category }
  });
};

// 10. Pengguna / User Registration / Role Change
export const notifyUser = (userName = 'Pengguna', action = 'terdaftar') => {
  return addNotification({
    type: NOTIF_TYPES.SYSTEM,
    title: `Pengguna ${action}`,
    message: `Akun "${userName}" telah ${action}.`,
    data: { userName, action }
  });
};

export const notifyPage = (pageName = '') => {
  return addNotification({
    type: NOTIF_TYPES.PAGE,
    title: 'Struktur Halaman Berubah',
    message: `Struktur halaman "${pageName}" telah diperbarui dan disimpan.`,
    data: { page: pageName }
  });
};

export const notifyWarning = (message = '') => {
  return addNotification({
    type: NOTIF_TYPES.WARNING,
    title: 'Pemberitahuan Sistem',
    message: message || 'Periksa kembali status konfigurasi Anda.',
  });
};

export const notifyError = (title = 'Pemberitahuan', err = '') => {
  return addNotification({
    type: NOTIF_TYPES.ERROR,
    title: title || 'Kesalahan Sistem',
    message: typeof err === 'string' ? err : err?.message || 'Terjadi kesalahan sistem.',
  });
};

export const notifySuccess = (title = 'Sukses', message = '') => {
  return addNotification({
    type: NOTIF_TYPES.SUCCESS,
    title: title || 'Berhasil',
    message: message || 'Operasi berhasil diselesaikan.',
  });
};

export const notifyRemoteEdit = () => Promise.resolve();

/* ── Subscribe to Realtime Cloud Notifications for UI ── */
export const subscribeToNotifications = (callback) => {
  // 1. Emit current local cache immediately
  const emitLocal = () => {
    const notifs = getLocalNotifs();
    callback(notifs);
  };
  emitLocal();

  const handleUpdate = () => emitLocal();
  const handleStorage = (e) => {
    if (e.key === STORAGE_KEY || e.key === READ_STATUS_KEY) emitLocal();
  };

  window.addEventListener('porto_admin_notifs_changed', handleUpdate);
  window.addEventListener('storage', handleStorage);

  // 2. Realtime Cloud Listener via Firestore onSnapshot (Hanya jika mode hybrid)
  let unsubFirestore = () => {};
  const currentEngine = typeof localStorage !== 'undefined' ? (localStorage.getItem('porto_storage_engine') || 'drive_first') : 'drive_first';
  if (db && currentEngine === 'hybrid') {
    try {
      const q = query(
        collection(db, 'porto_notifications'),
        orderBy('timestamp', 'desc'),
        limit(60)
      );

      unsubFirestore = onSnapshot(q, (snapshot) => {
        const readIds = getLocalReadIds();
        const currentUid = getCurrentUserId();

        const cloudNotifs = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const isRead = 
            readIds.has(docSnap.id) ||
            d.read === true ||
            (Array.isArray(d.readBy) && d.readBy.includes(currentUid));

          return {
            id: docSnap.id,
            type: d.type || NOTIF_TYPES.SAVE,
            title: d.title || 'Pemberitahuan',
            message: d.message || '',
            authorName: d.authorName || '',
            authorId: d.authorId || '',
            data: d.data || {},
            read: isRead,
            readBy: d.readBy || [],
            timestamp: d.timestamp || Date.now(),
            createdAt: d.createdAt || new Date().toISOString()
          };
        });

        if (cloudNotifs.length > 0) {
          setLocalNotifs(cloudNotifs);
          callback(cloudNotifs);
        }
      }, (err) => {
        console.warn('[Notifications] Firestore subscription error (falling back to local):', err.message);
      });
    } catch (e) {
      console.warn('[Notifications] Firestore init failed:', e);
    }
  }

  return () => {
    window.removeEventListener('porto_admin_notifs_changed', handleUpdate);
    window.removeEventListener('storage', handleStorage);
    if (typeof unsubFirestore === 'function') unsubFirestore();
  };
};

export const markAsRead = async (id) => {
  if (!id) return;
  addLocalReadId(id);

  const current = getLocalNotifs();
  const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
  setLocalNotifs(updated);

  const currentUid = getCurrentUserId();
  if (db && currentUid) {
    try {
      const notifRef = doc(db, 'porto_notifications', id);
      updateDoc(notifRef, {
        readBy: Array.from(new Set([...(current.find(n => n.id === id)?.readBy || []), currentUid]))
      }).catch(() => {});
    } catch {
      // Ignore Firestore update failure
    }
  }
};

export const markAllAsRead = async () => {
  const current = getLocalNotifs();
  current.forEach(n => addLocalReadId(n.id));
  const updated = current.map(n => ({ ...n, read: true }));
  setLocalNotifs(updated);

  const currentUid = getCurrentUserId();
  if (db && currentUid) {
    try {
      current.forEach(n => {
        const notifRef = doc(db, 'porto_notifications', n.id);
        updateDoc(notifRef, {
          readBy: Array.from(new Set([...(n.readBy || []), currentUid]))
        }).catch(() => {});
      });
    } catch {
      // Ignore Firestore bulk update failure
    }
  }
};

export const clearNotifications = async () => {
  const current = getLocalNotifs();
  setLocalNotifs([]);
  if (db) {
    try {
      current.forEach(n => {
        deleteDoc(doc(db, 'porto_notifications', n.id)).catch(() => {});
      });
    } catch {
      // Ignore Firestore clear failure
    }
  }
};

/* ── User Notifications (untuk client contact form/chat) ── */
export const addUserNotification = async (userId, data = {}) => {
  if (!userId || typeof window === 'undefined') return;
  try {
    const key = `porto_user_notifs_${userId}`;
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    const newNotif = {
      id: `unotif_${Date.now()}`,
      ...data,
      read: false,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify([newNotif, ...list].slice(0, 30)));
    window.dispatchEvent(new CustomEvent(`porto_user_notifs_${userId}`));
  } catch {
    // Ignore storage failure
  }
};

export const subscribeToUserNotifications = (userId, callback) => {
  if (!userId || typeof window === 'undefined') {
    callback([]);
    return () => {};
  }
  const key = `porto_user_notifs_${userId}`;
  const emit = () => {
    try {
      const raw = localStorage.getItem(key);
      callback(raw ? JSON.parse(raw) : []);
    } catch {
      callback([]);
    }
  };
  emit();
  const handler = () => emit();
  window.addEventListener(`porto_user_notifs_${userId}`, handler);
  return () => window.removeEventListener(`porto_user_notifs_${userId}`, handler);
};

export const markUserNotifAsRead = async (userId, notifId) => {
  if (!userId || typeof window === 'undefined') return;
  const key = `porto_user_notifs_${userId}`;
  try {
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    const updated = list.map(n => n.id === notifId ? { ...n, read: true } : n);
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(`porto_user_notifs_${userId}`));
  } catch {
    // Ignore storage update failure
  }
};
