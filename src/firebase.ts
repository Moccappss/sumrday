import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache, 
  getFirestore, 
  type Firestore 
} from "firebase/firestore";
import type { Analytics } from "firebase/analytics";
import type { FirebasePerformance } from "firebase/performance";
import { FIREBASE_CONFIG } from './config/AppConfig';

export type FirebaseConfig = typeof FIREBASE_CONFIG;

/** Ekspor konfigurasi aktif (untuk inspeksi/debug) */
export const firebaseConfig: FirebaseConfig = FIREBASE_CONFIG;

const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);

// Inisialisasi Firestore dengan persistentLocalCache (multi-tab sync) untuk menghemat token/kuota read Firebase
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    }),
    ignoreUndefinedProperties: true
  });
} catch {
  try {
    firestoreDb = initializeFirestore(app, {
      localCache: memoryLocalCache(),
      ignoreUndefinedProperties: true
    });
  } catch {
    firestoreDb = getFirestore(app);
  }
}

export const db: Firestore = firestoreDb;

export let analytics: Analytics | null = null;
export let perf: FirebasePerformance | null = null;

// Defer non-critical Firebase Analytics & Performance initialization until browser is idle
if (typeof window !== 'undefined') {
  const initTelemetry = () => {
    import('firebase/analytics')
      .then(({ getAnalytics }) => {
        analytics = getAnalytics(app);
      })
      .catch(() => {});
    import('firebase/performance')
      .then(({ getPerformance }) => {
        perf = getPerformance(app);
      })
      .catch(() => {});
  };
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(initTelemetry, { timeout: 4000 });
  } else {
    setTimeout(initTelemetry, 2500);
  }
}

export default app;
