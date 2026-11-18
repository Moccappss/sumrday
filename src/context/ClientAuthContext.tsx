import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  ClientUser, 
  getCurrentClient, 
  loginClient as apiLogin, 
  loginClientWithGoogle as apiLoginWithGoogle,
  registerClient as apiRegister, 
  logoutClient as apiLogout, 
  updateClientProfile as apiUpdateProfile, 
  changeClientPassword as apiChangePassword 
} from '../services/clientAuth';
import { useToast } from './ToastContext';

interface ClientAuthContextType {
  client: ClientUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<ClientUser>;
  loginWithGoogle: () => Promise<ClientUser>;
  register: (params: { name: string; email: string; phone?: string; password: string }) => Promise<ClientUser>;
  logout: () => void;
  updateProfile: (params: { name: string; phone?: string; avatar?: string; bankDetails?: any }) => Promise<ClientUser>;
  changePassword: (oldPw: string, newPw: string) => Promise<void>;
  
  // Modals state
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;

  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;

  isOrdersModalOpen: boolean;
  openOrdersModal: () => void;
  closeOrdersModal: () => void;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export const ClientAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<ClientUser | null>(() => getCurrentClient());
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    const handleAuthChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ client: ClientUser | null }>).detail;
      setClient(detail?.client !== undefined ? detail.client : getCurrentClient());
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'porto_current_client') {
        setClient(getCurrentClient());
      }
    };

    const handleOpenOrders = () => {
      setIsOrdersModalOpen(true);
    };

    window.addEventListener('porto_client_auth_changed', handleAuthChanged);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('porto_open_orders', handleOpenOrders);
    window.addEventListener('porto_open_order_tracker', handleOpenOrders);

    // Auto-detect URL parameter ?tracker=... or ?track=... or ?orderId=... on initial mount
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const trackQuery = sp.get('tracker') || sp.get('track') || sp.get('orderId') || sp.get('order');
      if (trackQuery) {
        setTimeout(() => {
          setIsOrdersModalOpen(true);
          window.dispatchEvent(new CustomEvent('porto_open_order_tracker', { detail: { query: trackQuery } }));
        }, 300);
      }
    }

    return () => {
      window.removeEventListener('porto_client_auth_changed', handleAuthChanged);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('porto_open_orders', handleOpenOrders);
      window.removeEventListener('porto_open_order_tracker', handleOpenOrders);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const user = await apiLogin(email, password);
      setClient(user);
      setIsAuthModalOpen(false);

      // 1x Read Firestore: Unduh data lisensi klien dan simpan ke IndexedDB untuk Zero-Read selanjutnya
      import('../utils/offlineLicenseDb')
        .then(({ syncClientLicensesToIndexedDb }) =>
          syncClientLicensesToIndexedDb(user.id || user.email, user.email)
        )
        .catch((err) => {
          console.warn('Background license sync to IndexedDB failed:', err);
        });

      showToast('Masuk Berhasil', `Selamat datang kembali, ${user.name}!`, 'success', 4000);
      return user;
    } catch (err: any) {
      showToast('Gagal Masuk', err.message || 'Email atau kata sandi tidak sesuai.', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await apiLoginWithGoogle();
      if (!user) return null as any;
      setClient(user);
      setIsAuthModalOpen(false);

      import('../utils/offlineLicenseDb')
        .then(({ syncClientLicensesToIndexedDb }) =>
          syncClientLicensesToIndexedDb(user.id || user.email, user.email)
        )
        .catch((err) => {
          console.warn('Background license sync to IndexedDB failed:', err);
        });

      showToast('Masuk Berhasil', `Selamat datang kembali, ${user.name}!`, 'success', 4000);
      return user;
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        return null as any;
      }
      showToast('Gagal Masuk', err.message || 'Gagal masuk dengan akun Google.', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const register = useCallback(async (params: { name: string; email: string; phone?: string; password: string }) => {
    setIsLoading(true);
    try {
      const user = await apiRegister(params);
      setClient(user);
      setIsAuthModalOpen(false);

      // Sinkronisasi inisial ke IndexedDB
      import('../utils/offlineLicenseDb')
        .then(({ syncClientLicensesToIndexedDb }) =>
          syncClientLicensesToIndexedDb(user.id || user.email, user.email)
        )
        .catch(() => {});

      showToast('Pendaftaran Berhasil', `Selamat datang di keluarga sumr.day, ${user.name}!`, 'success', 5000);
      return user;
    } catch (err: any) {
      showToast('Gagal Mendaftar', err.message || 'Terjadi kesalahan saat membuat akun.', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const logout = useCallback(() => {
    const prevName = client?.name || 'Pelanggan';
    const cId = client?.id || client?.email;
    if (cId) {
      import('../utils/offlineLicenseDb')
        .then(({ clearOfflineLicenses }) => clearOfflineLicenses(cId, client?.email))
        .catch(() => {});
    }
    apiLogout();
    setClient(null);
    setIsProfileModalOpen(false);
    setIsOrdersModalOpen(false);
    showToast('Sampai Jumpa', `Anda telah keluar dari akun ${prevName}.`, 'info', 3500);
  }, [client, showToast]);

  const updateProfile = useCallback(async (params: { name: string; phone?: string; avatar?: string; bankDetails?: any }) => {
    setIsLoading(true);
    try {
      const updated = await apiUpdateProfile(params);
      setClient(updated);
      showToast('Profil Diperbarui', 'Informasi akun Anda berhasil disimpan.', 'success');
      return updated;
    } catch (err: any) {
      showToast('Gagal Memperbarui Profil', err.message || 'Terjadi kesalahan.', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const changePassword = useCallback(async (oldPw: string, newPw: string) => {
    setIsLoading(true);
    try {
      await apiChangePassword(oldPw, newPw);
      showToast('Kata Sandi Diperbarui', 'Kata sandi akun Anda berhasil diganti.', 'success');
    } catch (err: any) {
      showToast('Gagal Mengubah Kata Sandi', err.message || 'Kata sandi lama tidak cocok.', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const openAuthModal = useCallback((mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const openProfileModal = useCallback(() => {
    setIsProfileModalOpen(true);
  }, []);

  const closeProfileModal = useCallback(() => {
    setIsProfileModalOpen(false);
  }, []);

  const openOrdersModal = useCallback(() => {
    setIsOrdersModalOpen(true);
  }, []);

  const closeOrdersModal = useCallback(() => {
    setIsOrdersModalOpen(false);
  }, []);

  return (
    <ClientAuthContext.Provider
      value={{
        client,
        isAuthenticated: !!client,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
        changePassword,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        isProfileModalOpen,
        openProfileModal,
        closeProfileModal,
        isOrdersModalOpen,
        openOrdersModal,
        closeOrdersModal,
      }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
};

export const useClientAuth = () => {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
};
