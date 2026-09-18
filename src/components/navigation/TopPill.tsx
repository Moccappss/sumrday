import React from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_NAMES: Record<string, string> = { '/lpimage/home': 'Home', '/lpimage/portofolio': 'Portofolio', '/lpimage/biodata': 'Biodata', '/katalog': 'Katalog' };

// TopPill is now ONLY the center pill — floating buttons moved to MainLayout
const TopPill = () => {
  const location = useLocation();
  const pageName = PAGE_NAMES[location.pathname] || 'Home';
  return (
      <div 
        className="top-pill-container"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur, 12px)) saturate(180%)',
          WebkitBackdropFilter: 'blur(var(--glass-blur, 12px)) saturate(180%)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
          height: 52, // Match interaction-btn height
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div className="top-pill-content" style={{ padding: '0 24px' }}>
          <span className="top-pill-text" style={{ color: 'var(--glass-text)' }}>{pageName}</span>
        </div>
      </div>
  );
};

export default TopPill;
