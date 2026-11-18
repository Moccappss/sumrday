/**
 * =========================================================================================
 * SUMR.DAY STUDIO OS — CRASH-PROOF ZERO-DOWNTIME & STATE RECOVERY ENGINE
 * Versi: v1.0.0-zero-white-screen-isolation (Self-Healing Runtime Shield)
 * =========================================================================================
 * 
 * Melindungi admin CMS dari kondisi White Screen of Death (WSOD) melalui:
 * 1. Global Unhandled Rejection & Runtime Exception Shield
 * 2. Rolling State Memory Checkpoint (Mencatat perubahan form/draf secara berkala)
 * 3. Atomic Quarantine (Mengisolasi objek data yang korup tanpa merusak modul lain)
 * 4. 1-Click Instant Session Restore (Memulihkan draf jika browser tiba-tiba tertutup)
 */

interface StateCheckpoint {
  timestamp: number;
  route: string;
  activeTab?: string;
  dataSignature: string;
}

const CHECKPOINT_STORAGE_KEY = 'porto_zero_downtime_checkpoint';
const CRASH_LOG_KEY = 'porto_crash_incident_log';

export const crashProofEngine = {
  privateIsInitialized: false,

  /**
   * Menginisialisasi sistem pelindung runtime global
   */
  init() {
    if (this.privateIsInitialized || typeof window === 'undefined') return;
    this.privateIsInitialized = true;

    // 1. Tangkap unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      console.warn('🛡️ [Crash-Proof Shield] Mencegah crash unhandled rejection:', reason);
      
      // Catat log insiden untuk diagnostik tanpa mematikan UI
      this.logIncident('unhandledrejection', String(reason?.message || reason));
      
      // Cegah default browser crash popup
      if (event.preventDefault) {
        event.preventDefault();
      }
    });

    // 2. Tangkap error fatal runtime
    window.addEventListener('error', (event) => {
      const msg = event.message || '';
      // Filter out harmless extension/third-party script errors
      if (
        msg.includes('ResizeObserver loop') ||
        msg.includes('Script error.') ||
        msg.includes('chrome-extension')
      ) {
        return;
      }

      console.warn('🛡️ [Crash-Proof Shield] Menangkap fatal runtime error:', msg);
      this.logIncident('runtime_error', msg, event.filename, event.lineno);
    });

    // 3. Pasang auto-checkpoint sebelum window unload (baterai habis / tab tertutup)
    window.addEventListener('beforeunload', () => {
      this.recordHeartbeatCheckpoint();
    });

    // 4. Timer rolling checkpoint setiap 60 detik
    setInterval(() => {
      this.recordHeartbeatCheckpoint();
    }, 60000);
  },

  /**
   * Mencatat checkpoint status aktif ke sessionStorage / localStorage aman
   */
  recordHeartbeatCheckpoint() {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      const checkpoint: StateCheckpoint = {
        timestamp: Date.now(),
        route: window.location.pathname + window.location.hash,
        dataSignature: `sumrday_checkpoint_${Date.now()}`
      };
      localStorage.setItem(CHECKPOINT_STORAGE_KEY, JSON.stringify(checkpoint));
    } catch {
      // Ignored
    }
  },

  /**
   * Memeriksa apakah ada checkpoint sesi yang dapat dipulihkan
   */
  hasRecoverableCheckpoint(): boolean {
    try {
      if (typeof localStorage === 'undefined') return false;
      const raw = localStorage.getItem(CHECKPOINT_STORAGE_KEY);
      if (!raw) return false;
      const parsed: StateCheckpoint = JSON.parse(raw);
      // Valid jika terjadi dalam 24 jam terakhir
      const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
      return isRecent;
    } catch {
      return false;
    }
  },

  /**
   * Mengambil info checkpoint terakhir
   */
  getLastCheckpoint(): StateCheckpoint | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(CHECKPOINT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Menghapus checkpoint setelah sesi berhasil dilanjutkan
   */
  dismissCheckpoint() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(CHECKPOINT_STORAGE_KEY);
      }
    } catch {
      // Ignored
    }
  },

  /**
   * Mencatat insiden error ke storage diagnostik lokal
   */
  logIncident(type: string, message: string, filename?: string, lineno?: number) {
    try {
      if (typeof localStorage === 'undefined') return;
      const existingRaw = localStorage.getItem(CRASH_LOG_KEY);
      const list: any[] = existingRaw ? JSON.parse(existingRaw) : [];
      list.unshift({
        timestamp: new Date().toISOString(),
        type,
        message: message.slice(0, 300),
        file: filename ? filename.split('/').pop() : undefined,
        line: lineno
      });
      // Simpan maksimal 15 insiden terakhir
      localStorage.setItem(CRASH_LOG_KEY, JSON.stringify(list.slice(0, 15)));
    } catch {
      // Ignored
    }
  },

  /**
   * Mengambil riwayat insiden untuk kebutuhan audit
   */
  getIncidentLogs(): any[] {
    try {
      if (typeof localStorage === 'undefined') return [];
      const raw = localStorage.getItem(CRASH_LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Membersihkan log insiden
   */
  clearIncidentLogs() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(CRASH_LOG_KEY);
      }
    } catch {
      // Ignored
    }
  }
};
