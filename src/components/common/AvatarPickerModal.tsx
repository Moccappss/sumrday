import React, { useState, useMemo } from 'react';
import { X, Search, Shuffle, Check, Sparkles, Palette, Heart, Compass, Users, Cpu, Glasses, Smile } from 'lucide-react';
import { ALL_AVATARS, AVATAR_CATEGORIES, getRandomAvatar } from '../../utils/avatarPresets';
import { useNativeBackHandler } from '../../utils/nativeNavigation';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAvatar?: string;
  onSelect: (url: string) => void;
  isDark?: boolean;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  onClose,
  selectedAvatar,
  onSelect,
  isDark = true
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Native 1-step back navigation
  useNativeBackHandler(isOpen, onClose, 'avatar_picker_modal', 10);

  const filteredAvatars = useMemo(() => {
    return ALL_AVATARS.filter((item) => {
      const matchesCat = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, search]);

  if (!isOpen) return null;

  const bg = isDark ? '#151824' : '#ffffff';
  const cardBg = isDark ? '#1f2436' : '#f8fafc';
  const text = isDark ? '#f8fafc' : '#0f172a';
  const subText = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: isDark ? 'rgba(0, 0, 0, 0.78)' : 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '85vh',
          background: bg,
          borderRadius: 24,
          border: `1px solid ${border}`,
          boxShadow: isDark ? '0 25px 60px rgba(0, 0, 0, 0.8)' : '0 25px 60px rgba(15, 23, 42, 0.14)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: text, fontFamily: "'Outfit', sans-serif" }}>
              Pilih Karakter Avatar ({ALL_AVATARS.length}+ Koleksi)
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: subText }}>
              Pilih karakter ilustrasi favorit Anda untuk foto profil akun.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                const randomUrl = getRandomAvatar();
                onSelect(randomUrl);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 100,
                background: 'var(--cms-accent-soft, rgba(124, 58, 237, 0.15))',
                color: 'var(--cms-accent, #7c3aed)',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Pilih Avatar Secara Acak"
            >
              <Shuffle size={14} /> Acak
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                border: 'none',
                color: text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search & Categories Bar */}
        <div style={{ padding: '14px 24px', borderBottom: `1px solid ${border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: subText }} />
            <input
              type="text"
              placeholder="Cari avatar (contoh: Arif, Peep, Knight, Cyber, Sakura)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: 12,
                background: cardBg,
                border: `1px solid ${border}`,
                color: text,
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Category Chips */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {AVATAR_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              const renderIcon = () => {
                switch (cat.iconName) {
                  case 'Palette': return <Palette size={13} />;
                  case 'Heart': return <Heart size={13} />;
                  case 'Compass': return <Compass size={13} />;
                  case 'Users': return <Users size={13} />;
                  case 'Cpu': return <Cpu size={13} />;
                  case 'Glasses': return <Glasses size={13} />;
                  case 'Smile': return <Smile size={13} />;
                  default: return <Sparkles size={13} />;
                }
              };

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 100,
                    border: `1px solid ${isActive ? 'var(--cms-accent, #7c3aed)' : border}`,
                    background: isActive ? 'var(--cms-accent, #7c3aed)' : cardBg,
                    color: isActive ? '#ffffff' : subText,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s'
                  }}
                >
                  {renderIcon()}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Avatar Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))',
            gap: 12,
            alignContent: 'flex-start'
          }}
        >
          {filteredAvatars.map((item) => {
            const isSelected = selectedAvatar === item.url;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item.url);
                  onClose();
                }}
                style={{
                  width: '100%',
                  aspectRatio: '1/1',
                  borderRadius: '50%',
                  border: `2.5px solid ${isSelected ? 'var(--cms-accent, #7c3aed)' : border}`,
                  padding: 3,
                  background: isSelected ? 'var(--cms-accent-soft, rgba(124, 58, 237, 0.15))' : cardBg,
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isSelected ? '0 0 0 4px var(--cms-accent-soft, rgba(124, 58, 237, 0.25))' : 'none',
                  transition: 'transform 0.15s, border-color 0.15s',
                  boxSizing: 'border-box'
                }}
                title={item.name}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <img
                  src={item.url}
                  alt={item.name}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      bottom: 0,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'var(--cms-accent, #7c3aed)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: `1px solid ${border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: cardBg
          }}
        >
          <span style={{ fontSize: 12, color: subText }}>
            Menampilkan {filteredAvatars.length} karakter avatar
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: `1px solid ${border}`,
              background: bg,
              color: text,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarPickerModal;
