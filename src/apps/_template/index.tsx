import React, { useState } from 'react';
import { LayoutGrid, Settings } from 'lucide-react';
import ClientView from './components/ClientView';
import AdminView from './components/AdminView';
import './styles.css';

export const config = {
  name: "Template App",
  color: "var(--cms-accent, #7c3aed)",
  description: "Struktur standar aplikasi dengan area Admin & Client.",
  iconData: null
};

// ==========================================
// KOMPONEN WADAH UTAMA (JANGAN DIHAPUS)
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('client');

  return (
    <div style={{ background: 'var(--cms-bg)', color: 'var(--cms-text)', minHeight: '100%', display: 'flex', flexDirection: 'column', borderRadius: 32, overflow: 'hidden', border: '1px solid var(--glass-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
      
      {/* HEADER NAVIGATION TABS */}
      <div style={{ display: 'flex', padding: '15px 20px', background: 'var(--cms-card-bg)', borderBottom: '1px solid var(--glass-border)', gap: 10 }}>
        <button 
          onClick={() => setActiveTab('client')}
          style={{ padding: '12px 24px', borderRadius: 99, fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', background: activeTab === 'client' ? 'var(--cms-accent)' : 'transparent', color: activeTab === 'client' ? '#fff' : 'var(--cms-text-muted)', boxShadow: activeTab === 'client' ? '0 8px 20px rgba(var(--cms-accent-rgb), 0.3)' : 'none' }}
          className={activeTab !== 'client' ? "hover-scale" : ""}
        >
          <LayoutGrid size={16} /> Mode Client
        </button>
        <button 
          onClick={() => setActiveTab('admin')}
          style={{ padding: '12px 24px', borderRadius: 99, fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', background: activeTab === 'admin' ? 'var(--cms-accent)' : 'transparent', color: activeTab === 'admin' ? '#fff' : 'var(--cms-text-muted)', boxShadow: activeTab === 'admin' ? '0 8px 20px rgba(var(--cms-accent-rgb), 0.3)' : 'none' }}
          className={activeTab !== 'admin' ? "hover-scale" : ""}
        >
          <Settings size={16} /> Mode Admin
        </button>
      </div>

      {/* KONTEN AKTIF */}
      <div style={{ flex: 1, position: 'relative', overflowY: 'auto', background: 'var(--cms-bg)' }}>
        {activeTab === 'client' ? <ClientView /> : <AdminView />}
      </div>

    </div>
  );
}
