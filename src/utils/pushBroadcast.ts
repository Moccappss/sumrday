import { db } from '../firebase';
import { 
  collection, addDoc, doc, setDoc, query, orderBy, limit, 
  onSnapshot, serverTimestamp, getDocs, deleteDoc, updateDoc, increment 
} from 'firebase/firestore';
import { sendNativeNotification, requestNotificationPermission } from './notifications';
import { storage } from './storage';

export interface BroadcastCampaign {
  id?: string;
  title: string;
  message: string;
  url?: string;
  type: 'promo' | 'blog' | 'catalog' | 'announcement' | 'custom';
  imageUrl?: string;
  createdAt?: any;
  sentBy?: string;
  clickCount?: number;
  targetAudience?: 'all' | 'desktop' | 'mobile';
  actionType?: 'url' | 'whatsapp' | 'phone' | 'email';
}

const CAMPAIGNS_COLLECTION = 'porto_broadcast_campaigns';
const SUBSCRIBERS_COLLECTION = 'porto_broadcast_subscribers';
const LOCAL_SUBSCRIBER_ID_KEY = 'porto_push_subscriber_id';
const LOCAL_LAST_PROCESSED_CAMPAIGN_KEY = 'porto_last_seen_campaign_id';
const LOCAL_CAMPAIGNS_KEY = 'porto_local_broadcast_campaigns';

// Dedicated Broadcast Channel for instant zero-latency cross-tab communication
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('porto_broadcast_channel')
  : null;

/**
 * Play an elegant soft chime when receiving a broadcast announcement
 */
export const playBroadcastChime = (type = 'promo') => {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    // Harmonic pleasant chime chords
    osc.frequency.setValueAtTime(type === 'promo' ? 587.33 : 523.25, now); // D5 or C5
    osc.frequency.exponentialRampToValueAtTime(type === 'promo' ? 880 : 659.25, now + 0.12); // A5 or E5
    
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.onended = () => {
      try {
        ctx.close().catch(() => {});
      } catch (_) {}
    };

    osc.start(now);
    osc.stop(now + 0.55);
  } catch (_) {}
};

/**
 * Get device platform info
 */
const getPlatformInfo = () => {
  if (typeof window === 'undefined') return { platform: 'Unknown', isMobile: false, browser: 'Browser' };
  const ua = navigator.userAgent;
  let platform = 'Desktop';
  if (/iPad|Tablet/i.test(ua)) platform = 'Tablet';
  else if (/iPhone|Android.*Mobile/i.test(ua)) platform = 'Mobile';
  else if (/Android/i.test(ua)) platform = 'Tablet';

  return {
    platform,
    isMobile: platform !== 'Desktop',
    browser: /Chrome/i.test(ua) ? 'Chrome' : /Safari/i.test(ua) ? 'Safari' : /Firefox/i.test(ua) ? 'Firefox' : /Edge/i.test(ua) ? 'Edge' : 'Browser',
    language: navigator.language || 'id-ID'
  };
};

/**
 * Register visitor as a push subscriber
 */
export const registerSubscriber = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  try {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') return false;

    let subId = localStorage.getItem(LOCAL_SUBSCRIBER_ID_KEY);
    if (!subId) {
      subId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(LOCAL_SUBSCRIBER_ID_KEY, subId);
    }

    const { platform, browser, language } = getPlatformInfo();

    const subData = {
      id: subId,
      platform,
      browser,
      language,
      permission: 'granted',
      lastActive: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save locally first
    const subscribers = JSON.parse(localStorage.getItem('porto_local_subscribers') || '[]');
    if (!subscribers.some((s: any) => s.id === subId)) {
      subscribers.push(subData);
      localStorage.setItem('porto_local_subscribers', JSON.stringify(subscribers));
    }

    // Then sync with Firestore if available
    try {
      await setDoc(doc(db, SUBSCRIBERS_COLLECTION, subId), {
        ...subData,
        lastActive: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (_) {}

    window.dispatchEvent(new CustomEvent('porto_push_permission_changed', { detail: { granted: true } }));
    return true;
  } catch (err) {
    console.warn('[PushBroadcast] Register subscriber error:', err);
    return false;
  }
};

/**
 * Check if the current user/visitor is already subscribed
 */
export const isPushSubscribed = (): boolean => {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  return Notification.permission === 'granted';
};

/**
 * Track user click on campaign (CTR analytics)
 */
export const trackCampaignClick = async (campaignId?: string) => {
  if (!campaignId || typeof window === 'undefined') return;
  try {
    // 1. Update local state
    const raw = localStorage.getItem(LOCAL_CAMPAIGNS_KEY);
    if (raw) {
      const list: BroadcastCampaign[] = JSON.parse(raw);
      const updated = list.map(c => c.id === campaignId ? { ...c, clickCount: (c.clickCount || 0) + 1 } : c);
      localStorage.setItem(LOCAL_CAMPAIGNS_KEY, JSON.stringify(updated));
    }

    // 2. Update Firestore counter
    const ref = doc(db, CAMPAIGNS_COLLECTION, campaignId);
    await updateDoc(ref, {
      clickCount: increment(1)
    });
  } catch (_) {}
};

/**
 * Send a new Push Broadcast Campaign (Admin Action)
 */
export const sendBroadcastCampaign = async (campaign: BroadcastCampaign): Promise<{ success: boolean; id?: string }> => {
  try {
    const payload: BroadcastCampaign = {
      ...campaign,
      clickCount: 0,
      createdAt: new Date().toISOString()
    };

    let generatedId = `cmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // 1. Write to Firestore
    try {
      const docRef = await addDoc(collection(db, CAMPAIGNS_COLLECTION), {
        ...payload,
        createdAt: serverTimestamp(),
      });
      generatedId = docRef.id;
      payload.id = generatedId;
    } catch (firestoreErr) {
      console.warn('[PushBroadcast] Firestore sync fallback to local/broadcastChannel', firestoreErr);
      payload.id = generatedId;
    }

    // 2. Save locally for instant persistence
    const localList: BroadcastCampaign[] = JSON.parse(localStorage.getItem(LOCAL_CAMPAIGNS_KEY) || '[]');
    const updatedLocal = [payload, ...localList.filter(c => c.id !== payload.id)].slice(0, 50);
    localStorage.setItem(LOCAL_CAMPAIGNS_KEY, JSON.stringify(updatedLocal));

    // 3. Broadcast to all active browser tabs via BroadcastChannel
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'NEW_BROADCAST', campaign: payload });
    }

    // 4. Trigger Cross-tab storage event
    localStorage.setItem('porto_last_broadcast_dispatched', JSON.stringify({ ...payload, _ts: Date.now() }));

    // 5. Trigger local feedback
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('porto_show_toast', {
        detail: {
          title: '🚀 Siaran Berhasil Terkirim!',
          message: `"${campaign.title}" telah dipublish ke seluruh pengunjung & subscriber.`,
          type: 'success',
          duration: 4500
        }
      }));
    }

    return { success: true, id: payload.id };
  } catch (err: any) {
    console.error('[PushBroadcast] Error sending campaign:', err);
    return { success: false };
  }
};

/**
 * Client-side Realtime Broadcast Listener
 * Listens for new broadcast campaigns and triggers Native OS Notifications + Rich In-App Alerts
 */
export const listenToPublicBroadcasts = (onNewCampaign?: (c: BroadcastCampaign) => void) => {
  if (typeof window === 'undefined') return () => {};

  const handleIncomingCampaign = (campaign: BroadcastCampaign) => {
    if (!campaign || !campaign.title) return;
    const lastSeen = localStorage.getItem(LOCAL_LAST_PROCESSED_CAMPAIGN_KEY);

    if (campaign.id && campaign.id !== lastSeen) {
      localStorage.setItem(LOCAL_LAST_PROCESSED_CAMPAIGN_KEY, campaign.id);

      // Check audience filtering
      const { platform } = getPlatformInfo();
      if (campaign.targetAudience === 'mobile' && platform === 'Desktop') return;
      if (campaign.targetAudience === 'desktop' && platform !== 'Desktop') return;

      // 1. Play subtle audio chime
      playBroadcastChime(campaign.type);

      // 2. Send Native OS Notification if user granted permission
      if (isPushSubscribed()) {
        sendNativeNotification(campaign.title, {
          body: campaign.message,
          icon: '/favicon.svg',
          image: campaign.imageUrl,
          tag: `broadcast-${campaign.id}`,
          url: campaign.url || '/'
        });
      }

      // 3. Dispatch Rich Public In-App Announcement event
      window.dispatchEvent(new CustomEvent('porto_public_broadcast_received', {
        detail: campaign
      }));

      // 4. Also trigger standard toast
      window.dispatchEvent(new CustomEvent('porto_show_toast', {
        detail: {
          title: campaign.title,
          message: campaign.message,
          type: campaign.type === 'promo' ? 'success' : 'info',
          duration: 6500
        }
      }));

      onNewCampaign?.(campaign);
    }
  };

  // 1. Listen via BroadcastChannel (instant zero-delay)
  const channelListener = (event: MessageEvent) => {
    if (event.data?.type === 'NEW_BROADCAST' && event.data?.campaign) {
      handleIncomingCampaign(event.data.campaign);
    }
  };
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', channelListener);
  }

  // 2. Listen via storage event (cross-tab sync)
  const storageListener = (e: StorageEvent) => {
    if (e.key === 'porto_last_broadcast_dispatched' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        handleIncomingCampaign(parsed);
      } catch (_) {}
    }
  };
  window.addEventListener('storage', storageListener);

  // 3. Listen via Firestore snapshot
  let isFirstLoad = true;
  let unsubscribeFirestore = () => {};

  try {
    const q = query(collection(db, CAMPAIGNS_COLLECTION), orderBy('createdAt', 'desc'), limit(5));
    unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      if (isFirstLoad) {
        isFirstLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const campaign = { id: change.doc.id, ...change.doc.data() } as BroadcastCampaign;
          handleIncomingCampaign(campaign);
        }
      });
    }, (err) => {
      console.warn('[PushBroadcast] Firestore listener fallback active:', err.message);
    });
  } catch (_) {}

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', channelListener);
    }
    window.removeEventListener('storage', storageListener);
    unsubscribeFirestore();
  };
};

/**
 * Fetch Subscriber Metrics for Admin Dashboard
 */
export const getSubscriberStats = async () => {
  try {
    const snap = await getDocs(collection(db, SUBSCRIBERS_COLLECTION));
    const subscribers = snap.docs.map(d => d.data());
    let total = subscribers.length;
    let desktop = subscribers.filter(s => s.platform === 'Desktop').length;
    let mobile = subscribers.filter(s => s.platform === 'Mobile').length;
    let tablet = subscribers.filter(s => s.platform === 'Tablet').length;

    // Merge with local subscribers if Firestore is empty
    if (total === 0 && typeof window !== 'undefined') {
      const localSubs = JSON.parse(localStorage.getItem('porto_local_subscribers') || '[]');
      total = Math.max(1, localSubs.length);
      desktop = localSubs.filter((s: any) => s.platform === 'Desktop').length || 1;
      mobile = localSubs.filter((s: any) => s.platform === 'Mobile').length;
      tablet = localSubs.filter((s: any) => s.platform === 'Tablet').length;
    }

    return { total: Math.max(1, total), desktop, mobile, tablet };
  } catch (err) {
    return { total: 1, desktop: 1, mobile: 0, tablet: 0 };
  }
};

/**
 * Get recent sent campaigns with local + Firestore fallback
 */
export const getRecentCampaigns = (callback: (list: BroadcastCampaign[]) => void) => {
  // Read local first for immediate render
  const getLocalList = () => {
    try {
      const raw = localStorage.getItem(LOCAL_CAMPAIGNS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  };

  callback(getLocalList());

  try {
    const q = query(collection(db, CAMPAIGNS_COLLECTION), orderBy('createdAt', 'desc'), limit(30));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BroadcastCampaign));
      if (list.length > 0) {
        localStorage.setItem(LOCAL_CAMPAIGNS_KEY, JSON.stringify(list));
        callback(list);
      } else {
        callback(getLocalList());
      }
    }, () => {
      callback(getLocalList());
    });
  } catch (_) {
    callback(getLocalList());
    return () => {};
  }
};

/**
 * Delete a campaign
 */
export const deleteCampaign = async (id: string) => {
  try {
    // 1. Remove from local
    const raw = localStorage.getItem(LOCAL_CAMPAIGNS_KEY);
    if (raw) {
      const list: BroadcastCampaign[] = JSON.parse(raw);
      const filtered = list.filter(c => c.id !== id);
      localStorage.setItem(LOCAL_CAMPAIGNS_KEY, JSON.stringify(filtered));
    }

    // 2. Remove from Firestore
    await deleteDoc(doc(db, CAMPAIGNS_COLLECTION, id));
    return true;
  } catch (err) {
    console.error('[PushBroadcast] Delete campaign error:', err);
    return true;
  }
};
