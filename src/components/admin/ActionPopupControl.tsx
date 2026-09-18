import React, { useState, useEffect } from 'react';
import { Link2, Layers, Plus, ExternalLink, Sparkles, Check } from 'lucide-react';
import { storage } from '../../utils/storage';
import GlassSelect from './GlassSelect';

export interface ActionPopupControlProps {
  actionType?: 'link' | 'popup';
  linkUrl?: string;
  popupId?: string;
  onChange: (updates: { actionType?: 'link' | 'popup'; linkUrl?: string; popupId?: string }) => void;
  bioLinkPages?: any[];
  label?: string;
}

const ActionPopupControl: React.FC<ActionPopupControlProps> = ({
  actionType = 'link',
  linkUrl = '',
  popupId = '',
  onChange,
  bioLinkPages = [],
  label = 'Aksi'
}) => {
  const [popups, setPopups] = useState<any[]>([]);
  const [isCreatingPopup, setIsCreatingPopup] = useState(false);
  const [newPopupTitle, setNewPopupTitle] = useState('');

  // Load existing popups from settings
  useEffect(() => {
    const unsub = storage.listenItem('porto_settings', (settings: any) => {
      if (settings?.popups && Array.isArray(settings.popups)) {
        setPopups(settings.popups);
      } else {
        setPopups([]);
      }
    });
    return () => {
      if (unsub && typeof unsub === 'function') unsub();
    };
  }, []);

  const handleCreatePopup = async () => {
    const title = newPopupTitle.trim() || 'Pop-up Baru';
    const newId = `popup_${Date.now()}`;
    const newPopup = {
      id: newId,
      title,
      slug: newId,
      createdAt: Date.now()
    };

    try {
      const currentSettings = await storage.getItem('porto_settings', {});
      const updatedPopups = [...(currentSettings?.popups || []), newPopup];
      await storage.setItem('porto_settings', { ...currentSettings, popups: updatedPopups });
      window.dispatchEvent(new Event('porto_settings_updated'));
      
      setPopups(updatedPopups);
      setNewPopupTitle('');
      setIsCreatingPopup(false);
      onChange({ actionType: 'popup', popupId: newId });
    } catch (err) {
      console.error('Failed to create popup:', err);
    }
  };

  const currentPopup = popups.find(p => p.id === popupId || p.slug === popupId);

  const handleOpenEditor = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!popupId) return;
    window.dispatchEvent(new CustomEvent('porto_edit_popup', {
      detail: {
        popupId,
        id: popupId,
        title: currentPopup?.title || 'Pop-up'
      }
    }));
  };

  return (
    <div className="cms-field-group" style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label className="cms-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={13} color="var(--cms-accent, #7c3aed)" /> {label}
        </label>
      </div>

      {/* Action Type Segmented Switcher */}
      <div
        style={{
          display: 'flex',
          background: 'var(--cms-switcher-bg)',
          borderRadius: 14,
          padding: 3,
          border: '1px solid var(--glass-border)',
          marginBottom: 10
        }}
      >
        <button
          type="button"
          onClick={() => onChange({ actionType: 'link' })}
          style={{
            flex: 1,
            padding: '7px 10px',
            border: 'none',
            borderRadius: 11,
            cursor: 'pointer',
            fontSize: 11.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            background: (actionType === 'link' || !actionType) ? 'var(--cms-switcher-item-bg, #fff)' : 'transparent',
            color: (actionType === 'link' || !actionType) ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-switcher-text)',
            boxShadow: (actionType === 'link' || !actionType) ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
          }}
        >
          <Link2 size={13} /> Link
        </button>
        <button
          type="button"
          onClick={() => onChange({ actionType: 'popup' })}
          style={{
            flex: 1,
            padding: '7px 10px',
            border: 'none',
            borderRadius: 11,
            cursor: 'pointer',
            fontSize: 11.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            background: actionType === 'popup' ? 'var(--cms-switcher-item-bg, #fff)' : 'transparent',
            color: actionType === 'popup' ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-switcher-text)',
            boxShadow: actionType === 'popup' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
          }}
        >
          <Layers size={13} /> Popup
        </button>
      </div>

      {/* ── Mode 1: Link URL ── */}
      {(actionType === 'link' || !actionType) && (
        <div>
          {bioLinkPages.length > 0 && (
            <div
              style={{
                marginBottom: 8,
                padding: '8px 10px',
                background: 'var(--cms-switcher-bg)',
                borderRadius: 12,
                border: '1px solid var(--glass-border)'
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 750, color: 'var(--cms-text-muted)', marginBottom: 5 }}>
                Bio Link:
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {bioLinkPages.map(bp => {
                  const path = (bp.isDefault || bp.slug === 'main') ? '/links' : `/links/${bp.slug}`;
                  const isSelected = linkUrl === path;
                  return (
                    <button
                      key={bp.id || bp.slug}
                      type="button"
                      onClick={() => onChange({ linkUrl: path })}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: isSelected ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-card-bg)',
                        color: isSelected ? '#ffffff' : 'var(--cms-text)',
                        border: `1px solid ${isSelected ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
                        fontSize: 10.5,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      🔗 {bp.title || bp.slug}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <input
            className="cms-input"
            type="text"
            placeholder="https://... atau /links"
            value={linkUrl || ''}
            onChange={e => onChange({ linkUrl: e.target.value })}
            style={{ width: '100%' }}
          />
        </div>
      )}

      {/* ── Mode 2: Pop-up Modal ── */}
      {actionType === 'popup' && (
        <div
          style={{
            background: 'var(--cms-switcher-bg)',
            padding: '12px',
            borderRadius: 16,
            border: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text)' }}>
              Popup:
            </span>
            <button
              type="button"
              onClick={() => setIsCreatingPopup(!isCreatingPopup)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--cms-accent, #7c3aed)',
                fontSize: 11,
                fontWeight: 750,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Plus size={13} /> Baru
            </button>
          </div>

          {/* Inline Create Popup Form */}
          {isCreatingPopup && (
            <div
              style={{
                display: 'flex',
                gap: 6,
                padding: '8px',
                background: 'var(--cms-card-bg)',
                borderRadius: 10,
                border: '1px solid var(--cms-accent)'
              }}
            >
              <input
                type="text"
                className="cms-input"
                placeholder="Nama..."
                value={newPopupTitle}
                onChange={e => setNewPopupTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreatePopup(); }}
                style={{ flex: 1, height: 32, fontSize: 11 }}
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreatePopup}
                className="cms-btn cms-btn-primary"
                style={{ height: 32, padding: '0 12px', fontSize: 11, borderRadius: 8 }}
              >
                <Check size={13} /> Buat
              </button>
            </div>
          )}

          {/* Popup Dropdown */}
          <GlassSelect
            value={popupId || ''}
            onChange={e => onChange({ popupId: e.target.value })}
            options={[
              { key: '', label: '-- Pilih --' },
              ...popups.map(p => ({
                key: p.id,
                label: p.title || p.id
              }))
            ]}
          />

          {/* Action Button: Edit Pop-up Canvas */}
          {popupId ? (
            <div>
              <button
                type="button"
                onClick={handleOpenEditor}
                className="cms-btn cms-btn-primary"
                style={{
                  width: '100%',
                  height: 38,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 750,
                  boxShadow: '0 4px 14px rgba(var(--cms-accent-rgb), 0.25)'
                }}
              >
                <ExternalLink size={14} /> Desain
              </button>
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: 10.5,
                  color: 'var(--cms-text-muted)',
                  lineHeight: 1.4,
                  textAlign: 'center'
                }}
              >
                Buka kanvas pop-up untuk mendesain blok & stiker.
              </p>
            </div>
          ) : (
            <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', textAlign: 'center', padding: '4px 0' }}>
              Pilih atau buat pop-up baru untuk menghubungkannya.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionPopupControl;
