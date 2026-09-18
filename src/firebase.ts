import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from "firebase/firestore";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { getPerformance, type FirebasePerformance } from "firebase/performance";
import { FIREBASE_CONFIG } from './config/AppConfig';

export type FirebaseConfig = typeof FIREBASE_CONFIG;

/** Ekspor konfigurasi aktif (untuk inspeksi/debug) */
export const firebaseConfig: FirebaseConfig = FIREBASE_CONFIG;

const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export const analytics: Analytics | null = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const perf: FirebasePerformance | null = typeof window !== 'undefined' ? getPerformance(app) : null;

export default app;
