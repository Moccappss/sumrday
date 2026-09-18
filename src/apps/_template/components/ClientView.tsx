import React from 'react';
import { Sparkles } from 'lucide-react';
import '../styles.css';

export default function ClientView() {
  return (
    <div className="app-client-container" style={{ padding: 20, minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 20, animation: 'cmsFadeIn 0.3s ease' }}>
      <div className="cms-card premium-glass" style={{ padding: 40, borderRadius: 30, textAlign: 'center', border: '1px solid var(--glass-border)' }}>
        <Sparkles size={48} style={{ color: 'var(--cms-accent)', marginBottom: 20, animation: 'pulse 2s infinite' }} />
        <h2 style={{ margin: '0 0 10px 0', fontSize: 28, fontWeight: 900, color: 'var(--cms-text)' }}>Area Client</h2>
        <p style={{ color: 'var(--cms-text-muted)', margin: '0 auto', maxWidth: 500, lineHeight: 1.6 }}>
          Halaman ini ditujukan untuk pengguna publik/klien. 
          Desain responsif dan menyatu dengan tampilan utama CMS.
          <br /><br />
          <strong style={{ color: 'var(--cms-accent)' }}>(AI: Edit komponen ini untuk membangun antarmuka utama)</strong>
        </p>
      </div>
    </div>
  );
}
