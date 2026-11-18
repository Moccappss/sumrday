import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, Mail, Clock, Trash2, UserCheck, ShieldAlert, 
  Search, Filter, Crown, X, Check, Loader2, TrendingUp, Activity, 
  Smartphone, MailCheck, Settings, Database, Layout, Lock, Unlock, Zap, ShieldCheck,
  FileText, Receipt, ChevronLeft, Copy, SlidersHorizontal, ShoppingBag, Phone, KeyRound,
  ExternalLink, Package, MessageCircle, AlertCircle, Edit3, Eye, EyeOff, Camera, Sparkles,
  Globe, Contact, Info
} from 'lucide-react';

import { db, auth, firebaseConfig } from '../../firebase';
import { 
  collection, query, onSnapshot, orderBy, 
  doc, setDoc, deleteDoc, updateDoc, serverTimestamp, getDocs
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import GlassSelect from './GlassSelect';
import { useDialog } from './DialogProvider';
import { useContextMenu } from './ContextMenuProvider';
import AvatarPickerModal from '../common/AvatarPickerModal';
import { googleSync } from '../../utils/googleSync';
import { CustomerHubView } from './CustomerHubView';
import { storage } from '../../utils/storage';
import { generateAffiliateCode, updateClientTier } from '../../services/clientAuth';
import { PartnershipHubManager } from './PartnershipHubManager';

const ROLE_OPTIONS = [
  { key: 'Super Admin', label: 'Super Admin', desc: 'Akses Penuh' },
  { key: 'Admin', label: 'Admin', desc: 'Kelola Konten & User' },
  { key: 'Editor', label: 'Editor', desc: 'Hanya Kelola Konten' },
  { key: 'Viewer', label: 'Viewer', desc: 'Hanya Lihat' },
  { key: 'Pending', label: 'Pending', desc: 'Menunggu Akses' }
];

const MODULES = [
  { id: 'dashboard', label: 'Overview', icon: <TrendingUp size={16} /> },
  { id: 'pages', label: 'LP Image', icon: <Layout size={16} /> },
  { id: 'blog', label: 'Blog', icon: <FileText size={16} /> },
  { id: 'projects', label: 'Projects & Tasks', icon: <Activity size={16} /> },
  { id: 'whiteboard', label: 'Whiteboard', icon: <Zap size={16} /> },
  { id: 'transactions', label: 'Transaksi & Nota', icon: <Receipt size={16} /> },
  { id: 'chat', label: 'Chat Room', icon: <Mail size={16} /> },
  { id: 'users', label: 'Manajemen User', icon: <Users size={16} /> },
  { id: 'storage', label: 'Storage Monitor', icon: <Database size={16} /> },
  { id: 'settings', label: 'Setelan Global', icon: <Settings size={16} /> },
  { id: 'activity', label: 'Log Aktivitas', icon: <Clock size={16} /> },
];

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

// Simple fast hash for client passwords
const hashSecret = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'pw_' + Math.abs(hash).toString(36) + '_' + str.length;
};

const UserManager = ({ notify }: { notify: (msg: string, type?: 'success' | 'error' | 'info') => void }) => {
  const { showConfirm } = useDialog();
  const { bindContextMenu } = useContextMenu();
  const location = useLocation();
  const navigate = useNavigate();

  // Active Tab: 'admin' (Tim & Admin CMS), 'clients' (Pelanggan Website), 'all-contacts' (Database Pelanggan Terpadu), or 'partnership' (Kemitraan, Afiliasi & Revisi)
  const [activeTab, setActiveTab] = useState<'admin' | 'clients' | 'all-contacts' | 'partnership'>('admin');

  // Admin / Team Users State
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddUserPassword, setShowAddUserPassword] = useState(false);

  // Client Users State
  const [clients, setClients] = useState<any[]>([]);
  const [clientOrders, setClientOrders] = useState<any[]>([]);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddClientPassword, setShowAddClientPassword] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [resettingPasswordClient, setResettingPasswordClient] = useState<any | null>(null);
  const [showResetClientPassword, setShowResetClientPassword] = useState(false);
  const [viewingOrdersClient, setViewingOrdersClient] = useState<any | null>(null);
  const [newClientPassword, setNewClientPassword] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', password: '', avatar: '' });
  const [avatarTarget, setAvatarTarget] = useState<{ type: 'user' | 'client' | 'newClient'; id: string; name: string; avatar: string } | null>(null);
  const [contactsCount, setContactsCount] = useState<number>(0);

  // Reseller / Affiliate Tier Modal State
  const [tierModalClient, setTierModalClient] = useState<any | null>(null);
  const [tierFormData, setTierFormData] = useState<{
    membershipTier: 'regular' | 'reseller' | 'affiliate' | 'vip';
    affiliateCode: string;
    affiliateCommissionRate: number;
    resellerDiscountRate: number;
    affiliateBalance: number;
    affiliateTotalEarnings: number;
    affiliateSalesCount: number;
  }>({
    membershipTier: 'regular',
    affiliateCode: '',
    affiliateCommissionRate: 10,
    resellerDiscountRate: 15,
    affiliateBalance: 0,
    affiliateTotalEarnings: 0,
    affiliateSalesCount: 0,
  });
  const [clientTierFilter, setClientTierFilter] = useState<'all' | 'regular' | 'reseller' | 'affiliate' | 'vip'>('all');

  const openTierModal = (cli: any) => {
    setTierModalClient(cli);
    setTierFormData({
      membershipTier: cli.membershipTier || 'regular',
      affiliateCode: cli.affiliateCode || generateAffiliateCode(cli.name, cli.id),
      affiliateCommissionRate: cli.affiliateCommissionRate !== undefined ? cli.affiliateCommissionRate : 10,
      resellerDiscountRate: cli.resellerDiscountRate !== undefined ? cli.resellerDiscountRate : 15,
      affiliateBalance: cli.affiliateBalance || 0,
      affiliateTotalEarnings: cli.affiliateTotalEarnings || 0,
      affiliateSalesCount: cli.affiliateSalesCount || 0,
    });
  };

  const handleSaveTierModal = async () => {
    if (!tierModalClient) return;
    try {
      await updateClientTier(tierModalClient.id, tierFormData);
      setClients(prev => prev.map(c => c.id === tierModalClient.id ? { ...c, ...tierFormData } : c));
      notify(`Level kemitraan ${tierModalClient.name} berhasil diperbarui menjadi ${tierFormData.membershipTier.toUpperCase()}!`, 'success');
      setTierModalClient(null);
    } catch (err: any) {
      notify(`Gagal memperbarui level: ${err?.message || ''}`, 'error');
    }
  };

  useEffect(() => {
    const updateCounts = async () => {
      try {
        const [leads, txs, custs] = await Promise.all([
          storage.getItem('porto_leads', []),
          storage.getItem('porto_transactions', []),
          storage.getItem('porto_customers', []),
        ]);
        const setKeys = new Set<string>();
        const addK = (p?: string, e?: string, n?: string) => {
          const c = (p || '').replace(/[^0-9]/g, '');
          if (c.length >= 8) setKeys.add(c.slice(-8));
          else if (e && e.trim()) setKeys.add(e.trim().toLowerCase());
          else if (n && n.trim()) setKeys.add(n.trim().toLowerCase());
        };
        (leads || []).forEach((l: any) => addK(l.phone, l.email, l.name));
        (clients || []).forEach((c: any) => addK(c.phone, c.email, c.name));
        (txs || []).forEach((t: any) => t.customer && addK(t.customer.phone, t.customer.email, t.customer.name));
        (custs || []).forEach((c: any) => addK(c.phone, c.email, c.name));
        setContactsCount(setKeys.size);
      } catch (_) {}
    };
    updateCounts();
    window.addEventListener('porto_customers_updated', updateCounts);
    window.addEventListener('porto_leads_updated', updateCounts);
    window.addEventListener('porto_transactions_updated', updateCounts);
    return () => {
      window.removeEventListener('porto_customers_updated', updateCounts);
      window.removeEventListener('porto_leads_updated', updateCounts);
      window.removeEventListener('porto_transactions_updated', updateCounts);
    };
  }, [clients]);

  const handleUpdateAvatar = async (url: string) => {
    if (!avatarTarget) return;
    try {
      if (avatarTarget.type === 'newClient') {
        setNewClient(prev => ({ ...prev, avatar: url }));
      } else if (avatarTarget.type === 'user') {
        await updateDoc(doc(db, 'users', avatarTarget.id), { avatar: url });
        setUsers(prev => prev.map(u => u.id === avatarTarget.id ? { ...u, avatar: url } : u));
        notify(`Avatar ${avatarTarget.name} berhasil diperbarui!`, 'success');
      } else if (avatarTarget.type === 'client') {
        await updateDoc(doc(db, 'porto_clients', avatarTarget.id), { avatar: url });
        setClients(prev => prev.map(c => c.id === avatarTarget.id ? { ...c, avatar: url } : c));
        notify(`Avatar ${avatarTarget.name} berhasil diperbarui!`, 'success');
      }
    } catch (err: any) {
      console.error('Error updating avatar:', err);
      notify('Gagal memperbarui avatar', 'error');
    } finally {
      setAvatarTarget(null);
    }
  };

  // For Side Drawer / Fullscreen Modal (Admin Permissions)
  const [showPermsDrawer, setShowPermsDrawer] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Fetch Admin / Team Users
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const userData = snapshot.docs.map(doc => {
        const data = doc.data();
        let effectiveScope = data.dbScope || 'global';
        if (data.role !== 'Super Admin') {
          effectiveScope = 'private';
        }
        return {
          id: doc.id,
          ...data,
          allowedPages: data.allowedPages || MODULES.map(m => m.id),
          dbScope: effectiveScope
        };
      });
      setUsers(userData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching admin users:", error);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  // 2. Fetch Client Users & Orders (Real-time)
  useEffect(() => {
    let unsubClients = () => {};
    let unsubOrders = () => {};

    try {
      const qClients = query(collection(db, 'porto_clients'), orderBy('createdAt', 'desc'));
      unsubClients = onSnapshot(qClients, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
        
        // Merge with local cache
        try {
          const raw = localStorage.getItem('porto_clients_cache');
          if (raw) {
            const localCache: Record<string, any> = JSON.parse(raw);
            Object.values(localCache).forEach((lc: any) => {
              const existingIdx = list.findIndex(c => c.id === lc.id || c.email === lc.email);
              if (existingIdx === -1) {
                list.push(lc);
              } else if (lc.rawPassword && !list[existingIdx].rawPassword) {
                list[existingIdx].rawPassword = lc.rawPassword;
              }
            });
          }
        } catch (_) {}

        setClients(list);
      }, (err) => {
        console.warn("Firestore clients snapshot fallback to cache:", err);
        try {
          const raw = localStorage.getItem('porto_clients_cache');
          if (raw) {
            setClients(Object.values(JSON.parse(raw)));
          }
        } catch (_) {}
      });
    } catch (_) {}

    try {
      const qOrders = query(collection(db, 'porto_orders'), orderBy('createdAt', 'desc'));
      unsubOrders = onSnapshot(qOrders, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setClientOrders(list);
      }, () => {});
    } catch (_) {}

    return () => {
      unsubClients();
      unsubOrders();
    };
  }, []);

  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Editor', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with browser URL
  useEffect(() => {
    if (!location.pathname.startsWith('/admin/users')) return;
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length >= 3 && parts[1] === 'users') {
      const targetId = parts[2];
      if (targetId === 'new') {
        setShowAddModal(true);
        setShowPermsDrawer(false);
      } else if (users.length > 0) {
        const found = users.find(u => u.id === targetId);
        if (found) {
          setSelectedUser(found);
          setShowPermsDrawer(true);
          setShowAddModal(false);
        }
      }
    } else if (parts.length === 2 && parts[1] === 'users') {
      setShowPermsDrawer(false);
      setShowAddModal(false);
      setSelectedUser(null);
    }
  }, [location.pathname, users]);

  const openDrawer = useCallback((user: any) => {
    setSelectedUser(user);
    setShowPermsDrawer(true);
    if (location.pathname !== `/admin/users/${user.id}`) {
      navigate(`/admin/users/${user.id}`, { replace: true });
    }
  }, [location.pathname, navigate]);

  const closeDrawer = useCallback(() => {
    setShowPermsDrawer(false);
    setSelectedUser(null);
    if (location.pathname !== '/admin/users') {
      navigate('/admin/users', { replace: true });
    }
  }, [location.pathname, navigate]);

  const openAddModal = useCallback(() => {
    setShowAddModal(true);
    setShowAddUserPassword(false);
    if (location.pathname !== '/admin/users/new') {
      navigate('/admin/users/new', { replace: true });
    }
  }, [location.pathname, navigate]);

  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    if (location.pathname !== '/admin/users') {
      navigate('/admin/users', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Admin Stats & Pending Users
  const pendingUsers = useMemo(() => {
    return users.filter(u => u.role === 'Pending' || u.status === 'Pending');
  }, [users]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'Active' && u.role !== 'Pending').length,
      pending: users.filter(u => u.role === 'Pending' || u.status === 'Pending').length,
      superAdmins: users.filter(u => u.role === 'Super Admin').length,
      privateDb: users.filter(u => u.dbScope === 'private').length
    };
  }, [users]);

  // Client Stats
  const clientStats = useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status !== 'Nonaktif').length;
    const totalOrdersCount = clientOrders.length;
    const clientsWithOrders = new Set(clientOrders.map(o => o.clientId)).size;

    return {
      total: totalClients,
      active: activeClients,
      withOrders: clientsWithOrders,
      ordersCount: totalOrdersCount
    };
  }, [clients, clientOrders]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      notify('Nama, Email, dan Password wajib diisi', 'error');
      return;
    }
    if (newUser.password.length < 6) {
      notify('Password minimal 6 karakter', 'error');
      return;
    }

    setIsSubmitting(true);
    let secondaryApp = null;
    try {
      secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);
      
      const authResult = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.password);
      const uid = authResult.user.uid;

      await setDoc(doc(db, 'users', uid), {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: 'Active',
        createdAt: serverTimestamp(),
        lastLogin: null,
        avatar: null,
        allowedPages: newUser.role === 'Super Admin' ? MODULES.map(m => m.id) : ['dashboard', 'projects'],
        dbScope: 'global'
      });

      // Sync to Google Drive / Sheets partitions
      try {
        const newAdminObj = { id: uid, name: newUser.name, email: newUser.email, role: newUser.role, status: 'Active', dbScope: 'global' };
        const updatedList = [...users, newAdminObj];
        await storage.setItem('porto_users', updatedList);
        googleSync.syncUsersToGoogle(updatedList).catch(() => {});
      } catch (_) {}
      
      setShowAddModal(false);
      setNewUser({ name: '', email: '', role: 'Editor', password: '' });
      notify('User Admin berhasil diregistrasi!');
    } catch (error: any) {
      console.error("Error adding user:", error);
      let msg = 'Gagal menambahkan user';
      if (error.code === 'auth/email-already-in-use') msg = 'Email sudah terdaftar';
      notify(msg, 'error');
    } finally {
      if (secondaryApp) await deleteApp(secondaryApp);
      setIsSubmitting(false);
    }
  };

  // ── Client Handlers ──
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.email || !newClient.password) {
      notify('Nama, Email, dan Password wajib diisi', 'error');
      return;
    }
    if (!newClient.phone?.trim()) {
      notify('Nomor WhatsApp wajib diisi!', 'error');
      return;
    }

    setIsSubmitting(true);
    const clientId = 'cli_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
    const passwordHash = hashSecret(newClient.password);
    const rawPassword = newClient.password;
    const nowStr = new Date().toISOString();

    const clientData = {
      id: clientId,
      name: newClient.name.trim(),
      email: newClient.email.trim().toLowerCase(),
      phone: newClient.phone.trim(),
      avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(newClient.name)}`,
      createdAt: nowStr,
      lastLoginAt: nowStr,
      status: 'Aktif',
      role: 'client',
      passwordHash,
    };

    try {
      await setDoc(doc(db, 'porto_clients', clientId), {
        ...clientData,
        createdAtServer: serverTimestamp()
      });

      // Save to local cache
      try {
        const raw = localStorage.getItem('porto_clients_cache');
        const cache = raw ? JSON.parse(raw) : {};
        cache[clientId] = clientData;
        localStorage.setItem('porto_clients_cache', JSON.stringify(cache));
      } catch (_) {}

      setClients(prev => [clientData, ...prev]);
      setShowAddClientModal(false);
      setNewClient({ name: '', email: '', phone: '', password: '' });
      notify('Akun Pelanggan berhasil ditambahkan!', 'success');

      // Save to storage partitions (Drive First)
      try {
        const existingClients = await storage.getItem('porto_clients', []);
        const updatedClients = [clientData, ...(Array.isArray(existingClients) ? existingClients : [])];
        await storage.setItem('porto_clients', updatedClients);

        const existingUsers = await storage.getItem('porto_users', []);
        const updatedUsers = [...(Array.isArray(existingUsers) ? existingUsers : []), clientData];
        await storage.setItem('porto_users', updatedUsers);
        googleSync.syncUsersToGoogle(updatedUsers).catch(() => {});
      } catch (_) {}

      // Auto-sync client to Google Contacts in background (Folder/Label: "Website")
      googleSync.syncContactToGoogle({
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        notes: 'Pelanggan Website Agenze Studio'
      }).catch(() => {});
    } catch (err: any) {
      console.error('Error adding client:', err);
      notify(`Gagal menambahkan client: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'porto_clients', editingClient.id), {
        name: editingClient.name,
        phone: editingClient.phone || '',
        status: editingClient.status || 'Aktif'
      });

      // Update local cache
      try {
        const raw = localStorage.getItem('porto_clients_cache');
        if (raw) {
          const cache = JSON.parse(raw);
          if (cache[editingClient.id]) {
            cache[editingClient.id] = { ...cache[editingClient.id], ...editingClient };
            localStorage.setItem('porto_clients_cache', JSON.stringify(cache));
          }
        }
      } catch (_) {}

      setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...editingClient } : c));
      setEditingClient(null);
      notify('Data Pelanggan berhasil diperbarui', 'success');
    } catch (err: any) {
      notify(`Gagal memperbarui client: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetClientPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingPasswordClient || !newClientPassword) return;

    if (newClientPassword.length < 5) {
      notify('Kata sandi baru minimal 5 karakter', 'error');
      return;
    }

    setIsSubmitting(true);
    const passwordHash = hashSecret(newClientPassword);
    try {
      await updateDoc(doc(db, 'porto_clients', resettingPasswordClient.id), {
        passwordHash,
      });

      // Update local cache
      try {
        const raw = localStorage.getItem('porto_clients_cache');
        if (raw) {
          const cache = JSON.parse(raw);
          if (cache[resettingPasswordClient.id]) {
            cache[resettingPasswordClient.id].passwordHash = passwordHash;
            delete cache[resettingPasswordClient.id].rawPassword;
            localStorage.setItem('porto_clients_cache', JSON.stringify(cache));
          }
        }
      } catch (_) {}

      setClients(prev => prev.map(c => c.id === resettingPasswordClient.id ? { ...c, passwordHash, rawPassword: undefined } : c));
      setResettingPasswordClient(null);
      setNewClientPassword('');
      notify(`Kata sandi pelanggan ${resettingPasswordClient.name} berhasil diperbarui dengan aman (SHA-256 Hash)!`, 'success');
    } catch (err: any) {
      notify(`Gagal mereset kata sandi: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveClientTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierModalClient) return;

    setIsSubmitting(true);
    try {
      const updated = await updateClientTier(tierModalClient.id, {
        membershipTier: tierFormData.membershipTier,
        affiliateCode: tierFormData.affiliateCode ? tierFormData.affiliateCode.trim().toUpperCase() : undefined,
        affiliateCommissionRate: Number(tierFormData.affiliateCommissionRate) || 0,
        resellerDiscountRate: Number(tierFormData.resellerDiscountRate) || 0,
        affiliateBalance: Number(tierFormData.affiliateBalance) || 0,
      });

      setClients(prev => prev.map(c => c.id === tierModalClient.id ? updated : c));
      notify(`Level membership ${tierModalClient.name} berhasil diperbarui ke ${tierFormData.membershipTier.toUpperCase()}!`, 'success');
      setTierModalClient(null);
    } catch (err: any) {
      console.error('Error updating client tier:', err);
      notify(`Gagal memperbarui level: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    const confirmed = await showConfirm(`Hapus akun pelanggan "${clientName}" secara permanen?`);
    if (confirmed) {
      try {
        await deleteDoc(doc(db, 'porto_clients', clientId));

        // Delete from local cache
        try {
          const raw = localStorage.getItem('porto_clients_cache');
          if (raw) {
            const cache = JSON.parse(raw);
            delete cache[clientId];
            localStorage.setItem('porto_clients_cache', JSON.stringify(cache));
          }
        } catch (_) {}

        setClients(prev => prev.filter(c => c.id !== clientId));
        notify(`Akun pelanggan ${clientName} telah dihapus`, 'success');
      } catch (err: any) {
        console.error('Error deleting client:', err);
        notify('Gagal menghapus akun pelanggan', 'error');
      }
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const updates: any = { role: newRole };
      if (newRole !== 'Pending') {
        updates.status = 'Active';
      }
      if (newRole === 'Super Admin') {
        updates.allowedPages = MODULES.map(m => m.id);
      }
      await updateDoc(doc(db, 'users', userId), updates);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
      notify(`Peran diupdate ke ${newRole}`);
      
      if (selectedUser && selectedUser.id === userId) {
         setSelectedUser((prev: any) => ({...prev, ...updates}));
      }
    } catch (error) {
      console.error("Error updating role:", error);
      notify('Gagal update peran', 'error');
    }
  };

  const handleApproveUser = async (targetUser: any, approvedRole: 'Editor' | 'Admin') => {
    try {
      const updates: any = {
        role: approvedRole,
        status: 'Active',
        allowedPages: approvedRole === 'Admin' ? MODULES.map(m => m.id) : ['dashboard', 'projects', 'blog', 'pages']
      };
      await updateDoc(doc(db, 'users', targetUser.id), updates);
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, ...updates } : u));
      notify(`Akun "${targetUser.name}" berhasil disetujui sebagai ${approvedRole}!`, 'success');
    } catch (err: any) {
      console.error('Error approving user:', err);
      notify(`Gagal menyetujui akun: ${err.message}`, 'error');
    }
  };

  const handleRejectUser = async (targetUser: any) => {
    showConfirm({
      title: 'Tolak & Hapus Permintaan Akun',
      message: `Apakah Anda yakin ingin menolak dan menghapus akun "${targetUser.name}" (${targetUser.email})? Pengguna ini tidak akan bisa login ke CMS.`,
      confirmLabel: 'Tolak & Hapus',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'users', targetUser.id));
          setUsers(prev => prev.filter(u => u.id !== targetUser.id));
          notify(`Permintaan akun "${targetUser.name}" berhasil ditolak & dihapus.`, 'info');
        } catch (err: any) {
          console.error('Error rejecting user:', err);
          notify(`Gagal menghapus user: ${err.message}`, 'error');
        }
      }
    });
  };

  const handleUpdatePerms = async (updates: any) => {
    if (!selectedUser) return;
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), updates);
      setSelectedUser((prev: any) => ({ ...prev, ...updates }));
      notify('Perizinan berhasil diperbarui');
    } catch (error) {
      console.error("Error updating perms:", error);
      notify('Gagal update perizinan', 'error');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userName === 'Arif Kurniawan' || (users.find(u => u.id === userId)?.role === 'Super Admin' && stats.superAdmins <= 1)) {
       notify('Tidak dapat menghapus Super Admin terakhir', 'error');
       return;
    }
    const confirmed = await showConfirm(`Hapus user "${userName}" secara permanen?`);
    if (confirmed) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        notify(`User ${userName} dihapus`, 'success');
        if (selectedUser && selectedUser.id === userId) setShowPermsDrawer(false);
      } catch (err) {
        console.error('Error deleting user:', err);
        notify('Gagal menghapus user', 'error');
      }
    }
  };

  const getUserContextMenu = (user: any) => ({
    title: user.name || 'Pengguna',
    subtitle: `${user.email} · ${user.role || 'User'}`,
    headerBadge: user.dbScope === 'private' ? 'Private DB' : 'Global DB',
    items: [
      {
        label: 'Ganti Avatar Profil',
        icon: <Camera size={15} color="var(--cms-accent)" />,
        action: () => setAvatarTarget({ type: 'user', id: user.id, name: user.name, avatar: user.avatar || '' })
      },
      {
        label: 'Kelola Hak Akses Modul',
        icon: <ShieldAlert size={15} color="var(--cms-accent)" />,
        action: () => openDrawer(user)
      },
      ...(user.dbScope === 'private' ? [{
        label: 'Inspeksi Database Private',
        icon: <Search size={15} color="#3b82f6" />,
        action: () => {
          window.dispatchEvent(new CustomEvent('porto_impersonate', { 
            detail: { uid: user.id, scope: user.dbScope, name: user.name, role: user.role, allowedPages: user.allowedPages } 
          }));
        }
      }] : []),
      {
        label: 'Salin Email Pengguna',
        icon: <Copy size={15} />,
        action: () => {
          navigator.clipboard?.writeText(user.email);
          notify('Email disalin ke clipboard');
        }
      },
      { separator: true },
      {
        label: 'Hapus Akun Pengguna',
        icon: <Trash2 size={15} />,
        danger: true,
        action: () => handleDeleteUser(user.id, user.name)
      }
    ]
  });

  const getClientContextMenu = (cli: any) => {
    const ordersCount = clientOrders.filter(o => o.clientId === cli.id).length;
    return {
      title: cli.name || 'Pelanggan',
      subtitle: `${cli.email} · ${cli.phone || 'Tanpa WhatsApp'}`,
      headerBadge: `${ordersCount} Pesanan`,
      items: [
        {
          label: 'Ganti Avatar Profil',
          icon: <Camera size={15} color="var(--cms-accent)" />,
          action: () => setAvatarTarget({ type: 'client', id: cli.id, name: cli.name, avatar: cli.avatar || '' })
        },
        {
          label: 'Edit Data Pelanggan',
          icon: <Edit3 size={15} color="var(--cms-accent)" />,
          action: () => setEditingClient(cli)
        },
        {
          label: 'Ganti Kata Sandi',
          icon: <KeyRound size={15} color="#f59e0b" />,
          action: () => { setResettingPasswordClient(cli); setNewClientPassword(''); setShowResetClientPassword(false); }
        },
        {
          label: 'Ganti Kata Sandi Pelanggan',
          icon: <KeyRound size={15} color="var(--cms-accent)" />,
          action: () => setResettingPasswordClient(cli)
        },
        {
          label: 'Lihat Riwayat Pesanan',
          icon: <ShoppingBag size={15} color="#10b981" />,
          action: () => setViewingOrdersClient(cli)
        },
        {
          label: 'Simpan ke Google Contacts',
          icon: <Globe size={15} color="#0284c7" />,
          action: () => googleSync.syncContactToGoogle(cli, notify)
        },
        ...(cli.phone ? [{
          label: 'Hubungi via WhatsApp',
          icon: <MessageCircle size={15} color="#22c55e" />,
          action: () => {
            const cleanPhone = cli.phone.replace(/[^0-9]/g, '');
            const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
            window.open(`https://wa.me/${waPhone}`, '_blank');
          }
        }] : []),
        {
          label: 'Salin Data Pelanggan',
          icon: <Copy size={15} />,
          action: () => {
            navigator.clipboard?.writeText(`Nama: ${cli.name}\nEmail: ${cli.email}\nWhatsApp: ${cli.phone || '-'}\nStatus: Terverifikasi (Sandi Terenkripsi SHA-256)`);
            notify('Data pelanggan disalin ke clipboard');
          }
        },
        { separator: true },
        {
          label: 'Hapus Akun Pelanggan',
          icon: <Trash2 size={15} />,
          danger: true,
          action: () => handleDeleteClient(cli.id, cli.name)
        }
      ]
    };
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClients = clients.filter(cli => {
    const matchesSearch = 
      cli.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cli.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cli.phone && cli.phone.includes(searchQuery)) ||
      (cli.affiliateCode && cli.affiliateCode.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (clientTierFilter === 'all') return true;
    const tier = cli.membershipTier || 'regular';
    return tier === clientTierFilter;
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="cms-spin" size={32} color="var(--cms-accent)" />
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      height: '100%',
      minHeight: 0,
      width: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      boxSizing: 'border-box'
    }}>
      <div className="cms-main-layout" style={{ 
        animation: 'cmsFadeIn 0.3s ease', 
        padding: isMobile ? '16px 16px 90px' : '24px 24px 80px', 
        maxWidth: 1280, 
        margin: '0 auto',
        boxSizing: 'border-box',
        width: '100%'
      }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>Member Club</h1>
          <Info size={14} style={{ color: 'var(--cms-text-muted)', cursor: 'help' }} title="Circle tim studio internal hingga membership mitra sumr.day." />
        </div>
        
        {activeTab === 'admin' ? (
          <button 
            onClick={openAddModal}
            className="cms-btn cms-btn-primary" 
            style={{ 
              width: 42, height: 42, padding: 0, borderRadius: '50%', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}
            title="Tambah Admin / Crew Studio"
            aria-label="Tambah Admin / Crew Studio"
          >
            <UserPlus size={18} />
          </button>
        ) : activeTab === 'clients' ? (
          <button 
            onClick={() => { setShowAddClientModal(true); setShowAddClientPassword(false); }}
            className="cms-btn cms-btn-primary" 
            style={{ 
              width: 42, height: 42, padding: 0, borderRadius: '50%', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}
            title="Tambah Member Club"
            aria-label="Tambah Member Club"
          >
            <UserPlus size={18} />
          </button>
        ) : null}
      </div>

      {/* Primary Section Tabs Switcher: Crew vs Club vs Contacts */}
      <div
        style={{
          display: 'flex',
          background: 'var(--cms-card-bg)',
          borderRadius: 100,
          padding: 4,
          marginBottom: 20,
          border: '1px solid var(--glass-border)',
          width: 'fit-content',
          maxWidth: '100%',
          gap: 4,
        }}
      >
        <button
          type="button"
          onClick={() => { setActiveTab('admin'); setSearchQuery(''); }}
          title={`Crew (${users.length})`}
          aria-label="Crew"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '7px 12px',
            borderRadius: 100,
            border: 'none',
            background: activeTab === 'admin' ? 'var(--cms-accent, #7c3aed)' : 'transparent',
            color: activeTab === 'admin' ? '#ffffff' : 'var(--cms-text-muted)',
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Crown size={16} />
          <span
            style={{
              fontSize: 11,
              padding: '2px 7px',
              borderRadius: 100,
              background: activeTab === 'admin' ? 'rgba(255,255,255,0.25)' : 'var(--cms-input-bg)',
              color: activeTab === 'admin' ? '#ffffff' : 'var(--cms-text)',
              fontWeight: 800
            }}
          >
            {users.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('clients'); setSearchQuery(''); }}
          title={`Club (${clients.length})`}
          aria-label="Club"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '7px 12px',
            borderRadius: 100,
            border: 'none',
            background: activeTab === 'clients' ? 'var(--cms-accent, #7c3aed)' : 'transparent',
            color: activeTab === 'clients' ? '#ffffff' : 'var(--cms-text-muted)',
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <ShoppingBag size={16} />
          <span
            style={{
              fontSize: 11,
              padding: '2px 7px',
              borderRadius: 100,
              background: activeTab === 'clients' ? 'rgba(255,255,255,0.25)' : 'var(--cms-input-bg)',
              color: activeTab === 'clients' ? '#ffffff' : 'var(--cms-text)',
              fontWeight: 800
            }}
          >
            {clients.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('all-contacts'); setSearchQuery(''); }}
          title={`Kontak (${contactsCount})`}
          aria-label="Kontak"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '7px 12px',
            borderRadius: 100,
            border: 'none',
            background: activeTab === 'all-contacts' ? 'var(--cms-accent, #7c3aed)' : 'transparent',
            color: activeTab === 'all-contacts' ? '#ffffff' : 'var(--cms-text-muted)',
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Contact size={16} />
          <span
            style={{
              fontSize: 11,
              padding: '2px 7px',
              borderRadius: 100,
              background: activeTab === 'all-contacts' ? 'rgba(255,255,255,0.25)' : 'var(--cms-input-bg)',
              color: activeTab === 'all-contacts' ? '#ffffff' : 'var(--cms-text)',
              fontWeight: 800
            }}
          >
            {contactsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('partnership'); setSearchQuery(''); }}
          title="Mitra"
          aria-label="Mitra"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 34,
            padding: 0,
            borderRadius: 100,
            border: 'none',
            background: activeTab === 'partnership' ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'transparent',
            color: activeTab === 'partnership' ? '#ffffff' : 'var(--cms-text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Sparkles size={16} color={activeTab === 'partnership' ? '#ffffff' : '#ec4899'} />
        </button>
      </div>

      {/* Render Content Based on Active Tab */}
      {activeTab === 'partnership' ? (
        <PartnershipHubManager notify={notify} confirm={showConfirm} clients={clients} />
      ) : activeTab === 'all-contacts' ? (
        <CustomerHubView notify={notify} clientList={clients} />
      ) : (
        <>

      {/* Stats Badges */}
      <div className="user-stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 10, 
        marginBottom: 20 
      }}>
        {activeTab === 'admin' ? (
          [
            { title: 'Total Admin', val: stats.total, icon: <Users size={16} />, color: 'var(--cms-accent)' },
            { title: 'Akses Aktif', val: stats.active, icon: <Activity size={16} />, color: '#10b981' },
            { title: 'Private DB', val: stats.privateDb, icon: <Database size={16} />, color: '#3b82f6' },
            { title: 'Super Admin', val: stats.superAdmins, icon: <Crown size={16} />, color: '#f59e0b' },
          ].map((s, i) => (
            <div 
              key={i} 
              title={s.title}
              style={{ 
                padding: '10px 12px', borderRadius: 16, border: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ 
                width: 32, height: 32, borderRadius: '50%', 
                background: `color-mix(in srgb, ${s.color} 12%, transparent)`, 
                color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
              }}>
                {s.icon}
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
                {s.val}
              </span>
            </div>
          ))
        ) : (
          [
            { title: 'Total Pelanggan', val: clientStats.total, icon: <Users size={16} />, color: 'var(--cms-accent)' },
            { title: 'Pelanggan Aktif', val: clientStats.active, icon: <UserCheck size={16} />, color: '#10b981' },
            { title: 'Pernah Memesan', val: clientStats.withOrders, icon: <ShoppingBag size={16} />, color: '#3b82f6' },
            { title: 'Total Order Masuk', val: clientStats.ordersCount, icon: <Package size={16} />, color: '#f59e0b' },
          ].map((s, i) => (
            <div 
              key={i} 
              title={s.title}
              style={{ 
                padding: '10px 12px', borderRadius: 16, border: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ 
                width: 32, height: 32, borderRadius: '50%', 
                background: `color-mix(in srgb, ${s.color} 12%, transparent)`, 
                color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
              }}>
                {s.icon}
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
                {s.val}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Main List Container */}
      <div className="user-list-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
           <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
             <Search size={17} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none', color: 'var(--cms-text)' }} />
             <input 
               placeholder={activeTab === 'admin' ? "Cari user admin..." : "Cari pelanggan (nama, email, WhatsApp)..."} 
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               style={{ 
                 height: 44, 
                 padding: '0 16px 0 46px', 
                 borderRadius: 100, 
                 background: 'var(--cms-card-bg)', 
                 border: '1.5px solid var(--glass-border)', 
                 fontSize: 13, 
                 width: '100%', 
                 fontWeight: 600, 
                 color: 'var(--cms-text)',
                 outline: 'none',
                 boxSizing: 'border-box',
                 transition: 'all 0.2s'
               }} 
             />
           </div>
        </div>

        {/* ── TAB 1: Admin / Team Users List ── */}
        {activeTab === 'admin' && (
          <>
            {/* ── Pending Users Approval Banner ── */}
            {pendingUsers.length > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(239, 68, 68, 0.08))',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 20,
                padding: '20px 22px',
                marginBottom: 24,
                boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f59e0b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}>
                      <ShieldAlert size={22} strokeWidth={2.4} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: 'var(--cms-text)' }}>
                          Permintaan Admin Baru Menunggu Persetujuan
                        </h4>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                          {pendingUsers.length} Permintaan
                        </span>
                      </div>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--cms-text-muted)', lineHeight: 1.5 }}>
                        Akun-akun ini baru mendaftar dan saat ini tertahan di <strong>Waiting Page</strong> sampai Anda menyetujuinya di sini.
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pendingUsers.map(pUser => (
                    <div 
                      key={pUser.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                        background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', borderRadius: 14, padding: '12px 18px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 220 }}>
                        <div style={{ 
                          width: 38, height: 38, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0,
                          border: '1px solid rgba(245, 158, 11, 0.3)'
                        }}>
                          {pUser.avatar ? <img src={pUser.avatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" /> : (pUser.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--cms-text)' }}>{pUser.name}</span>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#fef3c7', color: '#b45309' }}>
                              Pending
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--cms-text-muted)' }}>{pUser.email}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => handleApproveUser(pUser, 'Editor')}
                          style={{
                            height: 34, padding: '0 14px', borderRadius: 8, border: 'none', background: '#10b981', color: '#ffffff',
                            fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                          }}
                          title="Setujui pengguna ini dengan hak akses Editor (Kelola Konten)"
                        >
                          <Check size={14} strokeWidth={3} />
                          <span>Setujui (Editor)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApproveUser(pUser, 'Admin')}
                          style={{
                            height: 34, padding: '0 14px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#ffffff',
                            fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                          }}
                          title="Setujui pengguna ini dengan hak akses Admin (Kelola Konten & User)"
                        >
                          <Crown size={14} />
                          <span>Setujui (Admin)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRejectUser(pUser)}
                          style={{
                            height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.25)',
                            background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', fontSize: 12, fontWeight: 700,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                          }}
                          title="Tolak dan hapus akun pendaftar ini"
                        >
                          <Trash2 size={13} />
                          <span>Tolak</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="user-table-desktop">
              {filteredUsers.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', background: 'var(--cms-card-bg)', borderRadius: 20, border: '1px solid var(--glass-border)' }}>
                  <Users size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cms-text-muted)' }}>Tidak ada user admin ditemukan</div>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div 
                    key={user.id} 
                    {...bindContextMenu(() => getUserContextMenu(user))}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', 
                      background: 'var(--cms-card-bg)', borderRadius: 100, border: '1px solid var(--glass-border)',
                      cursor: 'context-menu'
                    }}
                  >
                     <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 240 }}>
                       <button
                         type="button"
                         onClick={(e) => {
                           e.stopPropagation();
                           setAvatarTarget({ type: 'user', id: user.id, name: user.name, avatar: user.avatar || '' });
                         }}
                         style={{ 
                           width: 44, height: 44, borderRadius: '50%', background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', 
                           display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, overflow: 'hidden',
                           border: '2px solid var(--glass-border)', cursor: 'pointer', padding: 0, position: 'relative', flexShrink: 0
                         }}
                         title="Klik untuk ganti avatar"
                       >
                         {user.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : user.name.charAt(0).toUpperCase()}
                       </button>
                       <div>
                         <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--cms-text)', marginBottom: 2 }}>{user.name}</div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--cms-text-muted)' }}>
                           {user.email}
                         </div>
                       </div>
                     </div>

                     <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: 220 }}>
                          <GlassSelect 
                            value={user.role} 
                            onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                            options={ROLE_OPTIONS}
                            style={{ 
                              height: 40, borderRadius: 100, fontSize: 13,
                              background: user.role === 'Super Admin' ? 'var(--cms-accent-soft)' : 'var(--cms-input-bg)',
                              border: user.role === 'Super Admin' ? '1px solid var(--cms-accent-soft)' : '1px solid var(--glass-border)',
                              color: user.role === 'Super Admin' ? 'var(--cms-accent)' : 'inherit'
                            }}
                          />
                        </div>
                     </div>

                     <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
                        <div 
                          title={user.dbScope === 'private' ? 'Private DB Scope' : 'Global DB Scope'}
                          aria-label={user.dbScope === 'private' ? 'Private DB Scope' : 'Global DB Scope'}
                          style={{ 
                            width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: user.dbScope === 'private' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: user.dbScope === 'private' ? '#3b82f6' : '#10b981',
                            border: `1px solid ${user.dbScope === 'private' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                            flexShrink: 0
                          }}
                        >
                          {user.dbScope === 'private' ? <Lock size={15} /> : <Unlock size={15} />}
                        </div>
                        {user.dbScope === 'private' && (
                          <button 
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('porto_impersonate', { 
                                detail: { uid: user.id, scope: user.dbScope, name: user.name, role: user.role, allowedPages: user.allowedPages } 
                              }));
                            }} 
                            className="cms-btn" 
                            style={{ 
                              width: 38, height: 38, padding: 0, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                              color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}
                            title="Inspeksi Database"
                            aria-label="Inspeksi Database"
                          >
                            <Search size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => openDrawer(user)} 
                          className="cms-btn" 
                          style={{ 
                            width: 38, height: 38, padding: 0, borderRadius: '50%', background: 'var(--cms-switcher-bg)', border: '1px solid var(--glass-border)',
                            color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}
                          title="Kelola Hak Akses Pengguna"
                          aria-label="Kelola Hak Akses Pengguna"
                        >
                          <ShieldAlert size={16} />
                        </button>
                        <button 
                          className="sidebar-icon-btn danger" 
                          style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0 }} 
                          onClick={() => handleDeleteUser(user.id, user.name)} 
                          title="Hapus Pengguna"
                          aria-label="Hapus Pengguna"
                        >
                          <Trash2 size={16} />
                        </button>
                     </div>
                  </div>
                ))
              )}
            </div>

            {/* Mobile Admin Cards */}
            <div className="user-list-mobile">
              {filteredUsers.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', background: 'var(--cms-card-bg)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                  <Users size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cms-text-muted)' }}>Tidak ada user admin ditemukan</div>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div 
                    key={user.id} 
                    className="cms-card user-card" 
                    {...bindContextMenu(() => getUserContextMenu(user))}
                    style={{ 
                      background: 'var(--cms-card-bg)', 
                      borderRadius: 16, 
                      padding: '12px', 
                      border: '1px solid var(--glass-border)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'stretch',
                      gap: 10,
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', boxSizing: 'border-box' }}>
                      <div style={{ 
                         width: 44, height: 44, borderRadius: '50%', background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', 
                         display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 
                      }}>
                        {user.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="" /> : user.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--cms-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</span>
                            {user.role === 'Super Admin' && <ShieldCheck size={15} color="#10b981" title="Super Admin" style={{ flexShrink: 0 }} />}
                         </div>
                         <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{user.email}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--cms-input-bg)', padding: '5px 8px', borderRadius: 12, border: '1px solid var(--glass-border)', width: '100%', boxSizing: 'border-box' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', whiteSpace: 'nowrap', paddingLeft: 4 }}>Peran:</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <GlassSelect 
                          value={user.role} 
                          onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                          options={ROLE_OPTIONS}
                          style={{ height: 32, borderRadius: 8, fontSize: 12, fontWeight: 800, width: '100%', padding: '0 6px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                         <button 
                           onClick={() => openDrawer(user)} 
                           title="Kelola Hak Akses" 
                           style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                         >
                            <SlidersHorizontal size={13} />
                         </button>
                         <button 
                           title="Hapus Pengguna"
                           style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} 
                           onClick={() => handleDeleteUser(user.id, user.name)}
                         >
                            <Trash2 size={13} />
                         </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ── TAB 2: Website Clients / Customers List ── */}
        {activeTab === 'clients' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Client Summary & Level Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Summary Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: 10
              }}>
                <div style={{ padding: '12px 16px', borderRadius: 16, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>Pelanggan</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>{clients.length}</div>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: 16, background: 'var(--cms-card-bg)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>Reseller</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>
                    {clients.filter(c => c.membershipTier === 'reseller').length}
                  </div>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: 16, background: 'var(--cms-card-bg)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>Afiliasi</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#6366f1', fontFamily: "'Outfit', sans-serif" }}>
                    {clients.filter(c => c.membershipTier === 'affiliate').length}
                  </div>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: 16, background: 'var(--cms-card-bg)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>VIP</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#f59e0b', fontFamily: "'Outfit', sans-serif" }}>
                    {clients.filter(c => c.membershipTier === 'vip').length}
                  </div>
                </div>
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                {[
                  { key: 'all', label: `Semua (${clients.length})` },
                  { key: 'reseller', label: `Reseller (${clients.filter(c => c.membershipTier === 'reseller').length})` },
                  { key: 'affiliate', label: `Afiliasi (${clients.filter(c => c.membershipTier === 'affiliate').length})` },
                  { key: 'vip', label: `VIP (${clients.filter(c => c.membershipTier === 'vip').length})` },
                  { key: 'regular', label: `Reguler (${clients.filter(c => !c.membershipTier || c.membershipTier === 'regular').length})` },
                ].map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setClientTierFilter(f.key as any)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 100,
                      border: '1px solid var(--glass-border)',
                      background: clientTierFilter === f.key ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-card-bg)',
                      color: clientTierFilter === f.key ? '#ffffff' : 'var(--cms-text-muted)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredClients.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', background: 'var(--cms-card-bg)', borderRadius: 20, border: '1px solid var(--glass-border)' }}>
                <ShoppingBag size={36} style={{ opacity: 0.3, margin: '0 auto 14px' }} />
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>
                  Belum Ada Akun Pelanggan
                </div>
                <div style={{ fontSize: 13, color: 'var(--cms-text-muted)', maxWidth: 360, margin: '0 auto 18px' }}>
                  Pelanggan yang mendaftar dari website client atau Anda daftarkan secara manual akan tampil di sini lengkap dengan pemulihan sandi.
                </div>
                <button
                  onClick={() => { setShowAddClientModal(true); setShowAddClientPassword(false); }}
                  className="cms-btn cms-btn-primary"
                  style={{ borderRadius: 100, padding: '10px 20px', fontSize: 13, fontWeight: 700 }}
                >
                  <UserPlus size={15} /> Tambah Pelanggan Baru
                </button>
              </div>
            ) : (
              filteredClients.map(cli => {
                const orders = clientOrders.filter(o => o.clientId === cli.id);
                const isRevealed = !!revealedPasswords[cli.id];
                const displayPassword = isRevealed ? (cli.rawPassword || '(Terenkripsi Aman)') : '••••••••';

                return (
                  <div
                    key={cli.id}
                    {...bindContextMenu(() => getClientContextMenu(cli))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: isMobile ? '16px' : '16px 24px',
                      background: 'var(--cms-card-bg)',
                      borderRadius: isMobile ? 18 : 100,
                      border: '1px solid var(--glass-border)',
                      flexWrap: isMobile ? 'wrap' : 'nowrap',
                      gap: 14,
                      boxShadow: 'var(--cms-shadow-sm)',
                    }}
                  >
                    {/* Left: Avatar & Profile Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: isMobile ? '100%' : 260, flex: 1 }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAvatarTarget({ type: 'client', id: cli.id, name: cli.name, avatar: cli.avatar || '' });
                        }}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          border: '2px solid var(--cms-accent, #7c3aed)',
                          background: 'var(--cms-input-bg)',
                          flexShrink: 0,
                          padding: 0,
                          cursor: 'pointer',
                          overflow: 'hidden'
                        }}
                        title="Klik untuk ganti avatar pelanggan"
                      >
                        <img
                          src={cli.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(cli.name)}`}
                          alt={cli.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </button>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>
                            {cli.name}
                          </span>
                          
                          {/* Dynamic Tier Badge */}
                          {(() => {
                            const tier = cli.membershipTier || 'regular';
                            if (tier === 'reseller') {
                              return (
                                <span
                                  onClick={() => openTierModal(cli)}
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    padding: '3px 9px',
                                    borderRadius: 100,
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#10b981',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                  title="Klik untuk ubah level & diskon reseller"
                                >
                                  Reseller ({cli.resellerDiscountRate || 15}%)
                                </span>
                              );
                            } else if (tier === 'affiliate') {
                              return (
                                <span
                                  onClick={() => openTierModal(cli)}
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    padding: '3px 9px',
                                    borderRadius: 100,
                                    background: 'rgba(99, 102, 241, 0.15)',
                                    color: '#6366f1',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                  title={`Kode: ${cli.affiliateCode || '-'} • Komisi: ${cli.affiliateCommissionRate || 10}%`}
                                >
                                  Afiliasi ({cli.affiliateCommissionRate || 10}%)
                                </span>
                              );
                            } else if (tier === 'vip') {
                              return (
                                <span
                                  onClick={() => openTierModal(cli)}
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    padding: '3px 9px',
                                    borderRadius: 100,
                                    background: 'rgba(245, 158, 11, 0.15)',
                                    color: '#f59e0b',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                  title="VIP Partner: Diskon & Komisi Aktif"
                                >
                                  VIP Partner
                                </span>
                              );
                            }
                            return (
                              <span
                                onClick={() => openTierModal(cli)}
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  padding: '3px 9px',
                                  borderRadius: 100,
                                  background: 'rgba(124, 58, 237, 0.12)',
                                  color: 'var(--cms-accent, #7c3aed)',
                                  cursor: 'pointer',
                                }}
                                title="Klik untuk upgrade ke Reseller/Afiliasi"
                              >
                                Pelanggan
                              </span>
                            );
                          })()}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--cms-text-muted)', marginTop: 2, flexWrap: 'wrap' }}>
                          <span>{cli.email}</span>
                          {cli.phone && (
                            <>
                              <span>•</span>
                              <span style={{ color: 'var(--cms-text)', fontWeight: 600 }}>{cli.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Secure Password Status & Orders */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: isMobile ? 'flex-start' : 'center', flex: isMobile ? '1 1 100%' : 1, flexWrap: 'wrap' }}>
                      {/* Secure Password Status Badge */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '5px 12px',
                          borderRadius: 100,
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          fontSize: 12,
                          color: 'var(--cms-text)',
                        }}
                        title="Kata sandi akun terproteksi secara aman (Hash SHA-256)"
                      >
                        <KeyRound size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, fontSize: 12, color: '#10b981' }}>
                          Terenkripsi Aman
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setResettingPasswordClient(cli);
                            setNewClientPassword('');
                            setShowResetClientPassword(false);
                          }}
                          title="Ganti Kata Sandi Klien"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--cms-accent, #D95629)',
                            cursor: 'pointer',
                            padding: '2px 6px',
                            fontSize: 11,
                            fontWeight: 800,
                            borderRadius: 4,
                            marginLeft: 2
                          }}
                        >
                          Ganti Sandi
                        </button>
                      </div>

                      <button
                        onClick={() => setViewingOrdersClient(cli)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 14px',
                          borderRadius: 100,
                          border: '1px solid var(--glass-border)',
                          background: orders.length > 0 ? 'rgba(16, 185, 129, 0.12)' : 'var(--cms-input-bg)',
                          color: orders.length > 0 ? '#10b981' : 'var(--cms-text-muted)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <ShoppingBag size={13} />
                        <span>{orders.length} Pesanan</span>
                      </button>
                    </div>

                    {/* Right: Actions (Icon-only minimalist toolbar) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', flexShrink: 0, width: isMobile ? '100%' : 'auto' }}>
                      {cli.phone && (
                        <button
                          type="button"
                          onClick={() => {
                            const cleanPhone = cli.phone.replace(/[^0-9]/g, '');
                            const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
                            window.open(`https://wa.me/${waPhone}`, '_blank');
                          }}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'rgba(34, 197, 94, 0.12)',
                            border: '1px solid rgba(34, 197, 94, 0.25)',
                            color: '#22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                          title="Chat WhatsApp"
                          aria-label="WhatsApp"
                        >
                          <MessageCircle size={15} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => { setResettingPasswordClient(cli); setNewClientPassword(''); setShowResetClientPassword(false); }}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'var(--cms-switcher-bg)',
                          border: '1px solid var(--glass-border)',
                          color: 'var(--cms-text)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                        title="Ganti Kata Sandi Client"
                        aria-label="Sandi"
                      >
                        <KeyRound size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTierModalClient(cli);
                          setTierFormData({
                            membershipTier: cli.membershipTier || 'regular',
                            affiliateCode: cli.affiliateCode || generateAffiliateCode(cli.name, cli.id),
                            affiliateCommissionRate: cli.affiliateCommissionRate ?? 10,
                            resellerDiscountRate: cli.resellerDiscountRate ?? 15,
                            affiliateBalance: cli.affiliateBalance ?? 0,
                          });
                        }}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'rgba(236, 72, 153, 0.12)',
                          border: '1px solid rgba(236, 72, 153, 0.3)',
                          color: '#ec4899',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                        title="Kelola Level Membership (Reseller / Afiliasi / VIP)"
                        aria-label="Kelola Level"
                      >
                        <Sparkles size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingClient(cli)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'var(--cms-switcher-bg)',
                          border: '1px solid var(--glass-border)',
                          color: 'var(--cms-text)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                        title="Edit Profil"
                        aria-label="Edit"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteClient(cli.id, cli.name)}
                        className="sidebar-icon-btn danger"
                        style={{ width: 36, height: 36, borderRadius: '50%' }}
                        title="Hapus Akun Pelanggan"
                        aria-label="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      </>
      )}

      {/* ── MODAL: Tambah Admin Baru ── */}
      <div className={`drawer-backdrop ${showAddModal ? 'open' : ''}`} onClick={closeAddModal} />
      <div className="add-user-modal" style={{
         position: 'fixed', top: '50%', left: '50%', transform: showAddModal ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.95)',
         opacity: showAddModal ? 1 : 0, pointerEvents: showAddModal ? 'all' : 'none',
         background: 'var(--cms-card-bg)', width: 'calc(100% - 32px)', maxWidth: 460, borderRadius: 20,
         boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1.5px solid var(--glass-border)',
         zIndex: 1000001, transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
         maxHeight: '90dvh', overflowY: 'auto'
      }}>
         <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
               <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>Tambah Admin / Tim Baru</h2>
               <button onClick={closeAddModal} className="sidebar-icon-btn" style={{ width: 36, height: 36, borderRadius: '50%' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
               <div className="modern-input-group">
                  <label>Nama Lengkap</label>
                  <div className="input-wrapper">
                     <ShieldCheck size={16} className="input-icon" />
                     <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Identitas..." required />
                  </div>
               </div>

               <div className="modern-input-group">
                  <label>Alamat Email</label>
                  <div className="input-wrapper">
                     <MailCheck size={16} className="input-icon" />
                     <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="email@domain.com" required />
                  </div>
               </div>

               <div className="modern-input-group">
                  <label>Kata Sandi</label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                     <Lock size={16} className="input-icon" />
                     <input type={showAddUserPassword ? 'text' : 'password'} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Minimal 6 karakter" required style={{ paddingRight: 44 }} />
                     <button
                        type="button"
                        onClick={() => setShowAddUserPassword(prev => !prev)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' }}
                     >
                        {showAddUserPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                     </button>
                  </div>
               </div>

               <div className="modern-input-group">
                  <label>Peran Akses</label>
                  <GlassSelect value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} options={ROLE_OPTIONS} style={{ height: 48, borderRadius: 100 }} />
               </div>

               <button type="submit" disabled={isSubmitting} className="cms-btn cms-btn-primary" style={{ height: 48, borderRadius: 100, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, marginTop: 12 }}>
                  {isSubmitting ? <Loader2 size={18} className="cms-spin" /> : <Check size={18} />}
                  Konfirmasi
               </button>
            </form>
         </div>
      </div>

      {/* ── MODAL: Tambah Pelanggan Baru ── */}
      <div className={`drawer-backdrop ${showAddClientModal ? 'open' : ''}`} onClick={() => setShowAddClientModal(false)} />
      <div style={{
         position: 'fixed', top: '50%', left: '50%', transform: showAddClientModal ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.95)',
         opacity: showAddClientModal ? 1 : 0, pointerEvents: showAddClientModal ? 'all' : 'none',
         background: 'var(--cms-card-bg)', width: 'calc(100% - 32px)', maxWidth: 460, borderRadius: 20,
         boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1.5px solid var(--glass-border)',
         zIndex: 1000001, transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
         maxHeight: '90dvh', overflowY: 'auto'
      }}>
         <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
               <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>Tambah Pelanggan Baru</h2>
               <button onClick={() => setShowAddClientModal(false)} className="sidebar-icon-btn" style={{ width: 36, height: 36, borderRadius: '50%' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddClient} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
               <div className="modern-input-group">
                  <label>Nama Lengkap Pelanggan</label>
                  <div className="input-wrapper">
                     <Users size={16} className="input-icon" />
                     <input type="text" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} placeholder="Cth: Budi Santoso" required />
                  </div>
               </div>

               <div className="modern-input-group">
                  <label>Alamat Email</label>
                  <div className="input-wrapper">
                     <MailCheck size={16} className="input-icon" />
                     <input type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} placeholder="budi@email.com" required />
                  </div>
               </div>

               <div className="modern-input-group">
                  <label>Nomor WhatsApp (Wajib)</label>
                  <div className="input-wrapper">
                     <Phone size={16} className="input-icon" />
                     <input type="tel" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} placeholder="Cth: 08123456789" required />
                  </div>
               </div>

               <div className="modern-input-group">
                  <label>Kata Sandi Akun</label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                     <Lock size={16} className="input-icon" />
                     <input type={showAddClientPassword ? 'text' : 'password'} value={newClient.password} onChange={e => setNewClient({...newClient, password: e.target.value})} placeholder="Minimal 5 karakter" required style={{ paddingRight: 44 }} />
                     <button
                        type="button"
                        onClick={() => setShowAddClientPassword(prev => !prev)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' }}
                     >
                        {showAddClientPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                     </button>
                  </div>
               </div>

               <button type="submit" disabled={isSubmitting} className="cms-btn cms-btn-primary" style={{ height: 48, borderRadius: 100, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, marginTop: 12 }}>
                  {isSubmitting ? <Loader2 size={18} className="cms-spin" /> : <Check size={18} />}
                  Tambah
               </button>
            </form>
         </div>
      </div>

      {/* ── MODAL: Edit Data Pelanggan ── */}
      {editingClient && (
        <>
          <div className="drawer-backdrop open" onClick={() => setEditingClient(null)} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'var(--cms-card-bg)', width: 'calc(100% - 32px)', maxWidth: 440, borderRadius: 20,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1.5px solid var(--glass-border)',
            zIndex: 1000001, padding: 24, display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>Edit Data Pelanggan</h2>
              <button onClick={() => setEditingClient(null)} className="sidebar-icon-btn" style={{ width: 36, height: 36, borderRadius: '50%' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleUpdateClient} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="modern-input-group">
                <label>Nama Lengkap</label>
                <div className="input-wrapper">
                  <Users size={16} className="input-icon" />
                  <input type="text" value={editingClient.name} onChange={e => setEditingClient({ ...editingClient, name: e.target.value })} required />
                </div>
              </div>

              <div className="modern-input-group">
                <label>Nomor WhatsApp (Wajib)</label>
                <div className="input-wrapper">
                  <Phone size={16} className="input-icon" />
                  <input type="tel" value={editingClient.phone || ''} onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })} placeholder="0812xxxxxxxx" required />
                </div>
              </div>

              <div className="modern-input-group">
                <label>Status Akun</label>
                <GlassSelect
                  value={editingClient.status || 'Aktif'}
                  onChange={e => setEditingClient({ ...editingClient, status: e.target.value })}
                  options={[
                    { key: 'Aktif', label: 'Aktif' },
                    { key: 'Nonaktif', label: 'Nonaktif' }
                  ]}
                  style={{ height: 44, borderRadius: 100 }}
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="cms-btn cms-btn-primary" style={{ height: 46, borderRadius: 100, fontWeight: 700, marginTop: 8 }}>
                Simpan
              </button>
            </form>
          </div>
        </>
      )}

      {/* ── MODAL: Reset Password Pelanggan ── */}
      {resettingPasswordClient && (
        <>
          <div className="drawer-backdrop open" onClick={() => setResettingPasswordClient(null)} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'var(--cms-card-bg)', width: 'calc(100% - 32px)', maxWidth: 420, borderRadius: 20,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1.5px solid var(--glass-border)',
            zIndex: 100005, padding: 24, display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>Setel Kata Sandi Baru</h2>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--cms-text-muted)' }}>Pelanggan: {resettingPasswordClient.name}</p>
              </div>
              <button onClick={() => setResettingPasswordClient(null)} className="sidebar-icon-btn" style={{ width: 36, height: 36, borderRadius: '50%' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleResetClientPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="modern-input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ margin: 0 }}>Kata Sandi Baru</label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewClientPassword('123456');
                      setShowResetClientPassword(true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--cms-accent, #7c3aed)',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Gunakan: 123456
                  </button>
                </div>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <KeyRound size={16} className="input-icon" />
                  <input
                    type={showResetClientPassword ? 'text' : 'password'}
                    required
                    value={newClientPassword}
                    onChange={e => setNewClientPassword(e.target.value)}
                    placeholder="Minimal 5 karakter (Cth: 123456)"
                    autoFocus
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetClientPassword(prev => !prev)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' }}
                  >
                    {showResetClientPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting || !newClientPassword} className="cms-btn cms-btn-primary" style={{ height: 46, borderRadius: 100, fontWeight: 700, marginTop: 8 }}>
                {isSubmitting ? <Loader2 size={16} className="cms-spin" /> : <Check size={16} />}
                Simpan
              </button>
            </form>
          </div>
        </>
      )}

      {/* ── MODAL: Riwayat Pesanan Pelanggan ── */}
      {viewingOrdersClient && (
        <>
          <div className="drawer-backdrop open" onClick={() => setViewingOrdersClient(null)} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'var(--cms-card-bg)', width: 'calc(100% - 32px)', maxWidth: 540, borderRadius: 20,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1.5px solid var(--glass-border)',
            zIndex: 1000001, padding: 24, display: 'flex', flexDirection: 'column', maxHeight: '85vh'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>Riwayat Pesanan Pelanggan</h2>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--cms-text-muted)' }}>{viewingOrdersClient.name} ({viewingOrdersClient.email})</p>
              </div>
              <button onClick={() => setViewingOrdersClient(null)} className="sidebar-icon-btn" style={{ width: 36, height: 36, borderRadius: '50%' }}><X size={18} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {clientOrders.filter(o => o.clientId === viewingOrdersClient.id).length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', background: 'var(--cms-input-bg)', borderRadius: 14, border: '1px dashed var(--glass-border)' }}>
                  <Package size={32} style={{ opacity: 0.4, margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cms-text)' }}>Belum ada catatan pesanan</div>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2 }}>Pelanggan ini belum pernah melakukan checkout di katalog.</div>
                </div>
              ) : (
                clientOrders.filter(o => o.clientId === viewingOrdersClient.id).map(order => (
                  <div key={order.id} style={{ background: 'var(--cms-input-bg)', padding: 14, borderRadius: 14, border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>{order.productName}</div>
                        {order.variantName && <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>Varian: {order.variantName}</div>}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 100, background: 'rgba(124, 58, 237, 0.15)', color: 'var(--cms-accent, #7c3aed)' }}>
                        {order.status || 'Pending'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--glass-border)', fontSize: 12 }}>
                      <span style={{ color: 'var(--cms-text-muted)' }}>
                        {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {order.quantity}x
                      </span>
                      <span style={{ fontWeight: 800, color: 'var(--cms-accent, #7c3aed)' }}>{formatRp(order.total)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ── MODAL: Kelola Level Kemitraan (Reseller & Affiliate) ── */}
      {tierModalClient && (
        <>
          <div className="drawer-backdrop open" onClick={() => setTierModalClient(null)} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'var(--cms-card-bg)', width: 'calc(100% - 32px)', maxWidth: 480, borderRadius: 24,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1.5px solid var(--glass-border)',
            zIndex: 1000002, padding: 24, display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#ec4899', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  <Sparkles size={13} /> Membership & Partnership
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: '4px 0 0', color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>
                  Kelola Level Klien
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--cms-text-muted)' }}>
                  {tierModalClient.name} • {tierModalClient.email}
                </p>
              </div>
              <button onClick={() => setTierModalClient(null)} className="sidebar-icon-btn" style={{ width: 36, height: 36, borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveClientTier} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Pilihan Level Tier */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 8 }}>
                  Tingkatan Level Akun
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {[
                    { id: 'regular', label: 'Pelanggan', desc: 'Harga standar katalog', border: 'var(--glass-border)', color: 'var(--cms-text)' },
                    { id: 'reseller', label: 'Reseller', desc: 'Diskon belanja langsung', border: 'rgba(59, 130, 246, 0.4)', color: '#3b82f6' },
                    { id: 'affiliate', label: 'Afiliasi', desc: 'Dapat komisi bagi hasil', border: 'rgba(236, 72, 153, 0.4)', color: '#ec4899' },
                    { id: 'vip', label: 'VIP Partner', desc: 'Prioritas & komisi/diskon', border: 'rgba(245, 158, 11, 0.4)', color: '#f59e0b' }
                  ].map(t => {
                    const isSelected = tierFormData.membershipTier === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTierFormData(prev => ({ ...prev, membershipTier: t.id as any }))}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          borderRadius: 14,
                          border: `1.5px solid ${isSelected ? t.color : 'var(--glass-border)'}`,
                          background: isSelected ? 'var(--cms-input-bg)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 800, color: isSelected ? t.color : 'var(--cms-text)' }}>
                          {t.label}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                          {t.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kode Referral / Afiliasi */}
              <div className="modern-input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ margin: 0 }}>Kode Referral / Kupon Afiliasi</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newCode = generateAffiliateCode(tierModalClient.name, tierModalClient.id);
                      setTierFormData(prev => ({ ...prev, affiliateCode: newCode }));
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--cms-accent, #7c3aed)',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Acak Kode Baru
                  </button>
                </div>
                <div className="input-wrapper">
                  <Sparkles size={16} className="input-icon" />
                  <input
                    type="text"
                    value={tierFormData.affiliateCode}
                    onChange={e => setTierFormData(prev => ({ ...prev, affiliateCode: e.target.value.toUpperCase() }))}
                    placeholder="CONTOH: SUMR88"
                    style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 4 }}>
                  Tautan affiliate klien: <span style={{ color: 'var(--cms-accent, #7c3aed)', fontWeight: 600 }}>{window.location.origin}/?ref={tierFormData.affiliateCode || 'KODE'}</span>
                </div>
              </div>

              {/* Diskon Reseller & Komisi Afiliasi (Grid 2 Kolom) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="modern-input-group">
                  <label>Diskon Reseller (%)</label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tierFormData.resellerDiscountRate}
                      onChange={e => setTierFormData(prev => ({ ...prev, resellerDiscountRate: Number(e.target.value) }))}
                      style={{ paddingLeft: 16 }}
                      placeholder="15"
                    />
                  </div>
                </div>

                <div className="modern-input-group">
                  <label>Komisi Afiliasi (%)</label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tierFormData.affiliateCommissionRate}
                      onChange={e => setTierFormData(prev => ({ ...prev, affiliateCommissionRate: Number(e.target.value) }))}
                      style={{ paddingLeft: 16 }}
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>

              {/* Saldo Komisi & Penyesuaian Saldo */}
              <div className="modern-input-group">
                <label>Saldo Komisi Afiliasi Aktif (Rp)</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    min="0"
                    value={tierFormData.affiliateBalance}
                    onChange={e => setTierFormData(prev => ({ ...prev, affiliateBalance: Number(e.target.value) }))}
                    style={{ paddingLeft: 16 }}
                    placeholder="0"
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 4 }}>
                  Total penghasilan tercatat: <strong>{formatRp(tierModalClient.affiliateTotalEarnings || 0)}</strong> • {tierModalClient.affiliateSalesCount || 0} order referral
                </div>
              </div>

              {tierModalClient.phone && (
                <div style={{ marginTop: 2 }}>
                  <button
                    type="button"
                    onClick={() => {
                      const cleanPhone = tierModalClient.phone.replace(/[^0-9]/g, '');
                      const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
                      let msg = '';
                      if (tierFormData.membershipTier === 'reseller') {
                        msg = `Halo Kak ${tierModalClient.name}!\n\nSelamat, akun Anda di sumr.day telah resmi diaktifkan sebagai *RESELLER STUDIO*. Anda berhak mendapatkan diskon khusus *${tierFormData.resellerDiscountRate}% OFF* untuk setiap pemesanan layanan & katalog.\n\nSilakan login ke dashboard akun Anda untuk melihat status: ${window.location.origin}/akun\n\nTerima kasih atas kemitraannya!`;
                      } else if (tierFormData.membershipTier === 'affiliate') {
                        msg = `Halo Kak ${tierModalClient.name}!\n\nSelamat, akun Anda di sumr.day telah resmi diaktifkan sebagai *MITRA AFILIASI*. Anda mendapatkan bagi hasil komisi *${tierFormData.affiliateCommissionRate}%* dari setiap transaksi.\n\nLink Referral Anda: ${window.location.origin}/?ref=${tierFormData.affiliateCode || 'KODE'}\nKode Kupon: *${tierFormData.affiliateCode || 'KODE'}*\n\nDashboard Kemitraan: ${window.location.origin}/akun\n\nSelamat membagikan link dan raih komisi Anda!`;
                      } else if (tierFormData.membershipTier === 'vip') {
                        msg = `Halo Kak ${tierModalClient.name}!\n\nSelamat, akun Anda telah di-upgrade menjadi *VIP PARTNER STUDIO* sumr.day dengan prioritas pengerjaan, diskon reseller *${tierFormData.resellerDiscountRate}%*, dan komisi afiliasi *${tierFormData.affiliateCommissionRate}%*.\n\nDashboard: ${window.location.origin}/akun`;
                      } else {
                        msg = `Halo Kak ${tierModalClient.name}, akun Anda di sumr.day telah aktif sebagai Pelanggan. Kunjungi katalog kami di: ${window.location.origin}/katalog`;
                      }
                      window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    title="Kirim Notifikasi WhatsApp Aktivasi Level"
                    style={{
                      width: '100%',
                      height: 42,
                      borderRadius: 100,
                      background: 'rgba(34, 197, 94, 0.12)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      color: '#22c55e',
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <MessageCircle size={15} /> Kirim WA
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setTierModalClient(null)}
                  className="cms-btn cms-btn-secondary"
                  style={{ flex: 1, height: 46, borderRadius: 100, fontWeight: 700 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cms-btn cms-btn-primary"
                  style={{ flex: 1, height: 46, borderRadius: 100, fontWeight: 700 }}
                >
                  {isSubmitting ? <Loader2 size={16} className="cms-spin" /> : <Check size={16} />}
                  Simpan Level
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── DRAWER: Admin Permissions ── */}
      <div className={`drawer-backdrop ${showPermsDrawer ? 'open' : ''}`} onClick={closeDrawer} />
      <div className={`side-drawer ${showPermsDrawer ? 'open' : ''}`}>
        {selectedUser && (
          <>
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--cms-panel-bg)',
              position: 'sticky',
              top: 0,
              zIndex: 20,
              flexShrink: 0
            }}>
              <button
                onClick={closeDrawer}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  background: 'var(--cms-card-bg)',
                  border: '1.5px solid var(--glass-border)',
                  borderRadius: 100,
                  color: 'var(--cms-text)',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <ChevronLeft size={16} /> Kembali
              </button>

              <div style={{ textAlign: 'center', flex: 1, padding: '0 12px', minWidth: 0 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Hak Akses & Peran
                </h3>
                <p style={{ color: 'var(--cms-text-muted)', fontSize: 11, margin: '2px 0 0', fontFamily: "'Inter', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedUser.name} ({selectedUser.email})
                </p>
              </div>

              <button
                onClick={closeDrawer}
                className="sidebar-icon-btn"
                style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={{
              padding: '20px 18px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              paddingBottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch'
            }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--cms-card-bg)', padding: 18, borderRadius: 20, border: '1.5px solid var(--glass-border)' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                    {selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                     <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                       {selectedUser.name}
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                       <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)' }}>
                         {selectedUser.role}
                       </span>
                       <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: selectedUser.status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: selectedUser.status === 'Active' ? '#10b981' : '#ef4444' }}>
                         {selectedUser.status}
                       </span>
                     </div>
                  </div>
               </div>

               <div style={{ background: 'var(--cms-card-bg)', padding: 18, borderRadius: 20, border: '1.5px solid var(--glass-border)' }}>
                 <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cms-text)', marginBottom: 10, fontFamily: "'Outfit', sans-serif" }}>Peran Pengguna</div>
                 <GlassSelect 
                   value={selectedUser.role} 
                   onChange={e => handleUpdateRole(selectedUser.id, e.target.value)} 
                   options={ROLE_OPTIONS} 
                   style={{ height: 46, borderRadius: 100, width: '100%' }} 
                 />
               </div>

               {/* Modules Permission Checkboxes */}
               <div style={{ background: 'var(--cms-card-bg)', padding: 18, borderRadius: 20, border: '1.5px solid var(--glass-border)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
                   <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>
                     Izin Akses Modul ({selectedUser.allowedPages?.length || 0}/{MODULES.length})
                   </div>
                   {/* Smart Preset Buttons */}
                   {selectedUser.role !== 'Super Admin' && (
                     <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                       <button
                         type="button"
                         onClick={() => handleUpdatePerms({ allowedPages: ['dashboard', 'pages', 'projects', 'whiteboard', 'storage'] })}
                         style={{
                           fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 9999,
                           background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)',
                           color: 'var(--cms-accent, #6366f1)', cursor: 'pointer'
                         }}
                         title="Preset Desainer & Tim Kreatif"
                       >
                         🎨 Creative
                       </button>
                       <button
                         type="button"
                         onClick={() => handleUpdatePerms({ allowedPages: ['dashboard', 'transactions', 'chat', 'projects'] })}
                         style={{
                           fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 9999,
                           background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)',
                           color: '#10b981', cursor: 'pointer'
                         }}
                         title="Preset Keuangan & Penjualan"
                       >
                         💼 Sales
                       </button>
                       <button
                         type="button"
                         onClick={() => handleUpdatePerms({ allowedPages: ['dashboard', 'blog', 'pages', 'storage'] })}
                         style={{
                           fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 9999,
                           background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)',
                           color: '#f59e0b', cursor: 'pointer'
                         }}
                         title="Preset Penulis & SEO"
                       >
                         ✍️ Content
                       </button>
                       <button
                         type="button"
                         onClick={() => handleUpdatePerms({ allowedPages: MODULES.map(m => m.id) })}
                         style={{
                           fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 9999,
                           background: 'rgba(255, 255, 255, 0.08)', border: '1px solid var(--glass-border)',
                           color: 'var(--cms-text)', cursor: 'pointer'
                         }}
                         title="Beri Semua Akses"
                       >
                         🌟 Semua
                       </button>
                     </div>
                   )}
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                   {MODULES.map(m => {
                     const isAllowed = selectedUser.role === 'Super Admin' || (selectedUser.allowedPages || []).includes(m.id);
                     return (
                       <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', cursor: selectedUser.role === 'Super Admin' ? 'not-allowed' : 'pointer' }}>
                         <input
                           type="checkbox"
                           disabled={selectedUser.role === 'Super Admin'}
                           checked={isAllowed}
                           onChange={() => {
                             const current = selectedUser.allowedPages || [];
                             const next = current.includes(m.id) ? current.filter((id: string) => id !== m.id) : [...current, m.id];
                             handleUpdatePerms({ allowedPages: next });
                           }}
                           style={{ width: 16, height: 16, accentColor: 'var(--cms-accent, #7c3aed)' }}
                         />
                         <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--cms-text)' }}>
                           {m.icon}
                           <span>{m.label}</span>
                         </div>
                       </label>
                     );
                   })}
                 </div>
               </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .side-drawer {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100dvh;
          max-width: 100vw;
          background: var(--cms-bg, #0d0f17);
          z-index: 100010;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.3s, box-shadow 0.3s ease;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: none !important;
          visibility: hidden;
          pointer-events: none;
        }
        .side-drawer.open {
          transform: translateX(0);
          visibility: visible;
          pointer-events: auto;
        }
        .drawer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 100000;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .drawer-backdrop.open {
          opacity: 1;
          pointer-events: all;
        }
        
        .modern-input-group label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 6px;
          color: var(--cms-text-muted);
        }
        .modern-input-group .input-wrapper {
          position: relative;
        }
        .modern-input-group .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.5;
          color: var(--cms-text);
          pointer-events: none;
        }
        .modern-input-group input {
          width: 100%;
          height: 48px;
          padding-left: 44px;
          padding-right: 16px;
          border-radius: 100px;
          background: var(--cms-input-bg);
          border: 1.5px solid var(--glass-border);
          font-size: 14px;
          font-weight: 500;
          color: var(--cms-text);
          transition: 0.2s;
          box-sizing: border-box;
        }
        .modern-input-group input:focus {
          border-color: var(--cms-accent);
          box-shadow: 0 0 0 2px var(--cms-accent-soft);
          outline: none;
        }
        
        .user-list-mobile {
          display: none !important;
        }
        .user-table-desktop {
          display: flex !important;
          flex-direction: column;
          gap: 8px;
        }
        
        @media (min-width: 901px) {
          .side-drawer {
            left: auto;
            width: 500px;
            max-width: 500px;
            background: var(--cms-card-bg);
            border-left: 1.5px solid var(--glass-border);
            box-shadow: none !important;
          }
          .side-drawer.open {
            box-shadow: -12px 0 40px rgba(0,0,0,0.25) !important;
          }
        }
        
        @media (max-width: 900px) {
          .user-table-desktop { display: none !important; }
          .user-list-mobile { display: flex !important; flex-direction: column; gap: 12px; }
          .cms-main-layout {
            padding: 16px 16px calc(90px + env(safe-area-inset-bottom, 16px)) 16px !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
      </div>
    </div>
  );
};

export default UserManager;
