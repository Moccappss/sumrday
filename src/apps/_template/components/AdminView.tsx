import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import '../styles.css';

export default function AdminView() {

  const [items, setItems] = useState([]);

  return (
    <div className="app-admin-container" style={{ padding: 20, minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 20, animation: 'cmsFadeIn 0.3s ease' }}>
      <div className="cms-card premium-glass" style={{ padding: 30, borderRadius: 30, border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', fontSize: 22, fontWeight: 900, color: 'var(--cms-text)' }}>Pengaturan Admin</h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--cms-text-muted)' }}>Panel kendali untuk mengatur konten aplikasi.</p>
          </div>
          <button className="cms-btn hover-scale" style={{ padding: '12px 20px', borderRadius: 99, background: 'var(--cms-accent)', color: '#fff', border: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 8px 20px rgba(var(--cms-accent-rgb), 0.3)' }}>
            <Plus size={16} /> Tambah Data
          </button>
        </div>
        
        {/* Konten Placeholder Admin */}
        <div style={{ background: 'var(--cms-switcher-bg)', padding: 40, borderRadius: 24, textAlign: 'center', color: 'var(--cms-text-muted)', fontWeight: 600 }}>
          {items.length === 0 ? (
            <>
              Belum ada data.
              <br/>
              <span style={{ fontSize: 12, opacity: 0.7, color: 'var(--cms-accent)' }}>(AI: Edit komponen ini untuk membangun tabel manajemen data / form input)</span>
            </>
          ) : (
            <div>Data berhasil dimuat.</div>
          )}
        </div>
      </div>
    </div>
  );
}
