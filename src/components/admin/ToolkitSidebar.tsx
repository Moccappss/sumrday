import React, { useState } from 'react';
import { LayoutGrid, Eye, EyeOff, ChevronUp, ChevronDown, ChevronRight, Layers, Target, Link, Video, Loader2, FileText, Plus, Settings, Monitor, Smartphone, FilePlus, ImagePlus, Sparkles, X, Image as ImageIcon } from 'lucide-react';

import { uploadToCloudinary } from '../../utils/cloudinary';
import PagesManager from './PagesManager';

const ToolkitSidebar = ({

  activePage, onSwitchPage,

  cmsMode, onModeChange,
  // Content mode

  blocks, selectedBlockId, onSelectBlock,
  // Sticker mode

  stickers, selectedStickerId, onSelectSticker, onUpdateSticker,
  // Frame mode

  currentFrames, onUpdateFrames,
  // Visibility
  contentVisibility, setContentVisibility,
  stickerVisibility, setStickerVisibility,
  frameVisibility, setFrameVisibility,
  // Pages Manager
  customPages, onUpdatePages, onEditPage, confirm, notify, selectedPageSlug, onSelectPage,
  // Sidebar footer actions

  previewSize, onTogglePreviewSize, onAddContent, onAddSticker
}) => {

  const [isUploadingFrame, setIsUploadingFrame] = useState({ top: false, bottom: false });

  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  
  // Handle consolidated mode name

  const displayMode = cmsMode === 'content' || cmsMode === 'sticker' || cmsMode === 'frame' ? 'toolkit' : cmsMode;
  const isDashboard = activePage === 'dashboard' || activePage === 'projects';
  const isSettings = activePage === 'settings';
  
  if (isSettings || isDashboard) return null;

  return (
    <div className="cms-toolkit-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', minHeight: 0, overflow: 'hidden' }}>
      {/* Pages List with Integrated Header and Toolbar (Primary View) */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PagesManager 
          customPages={customPages}
          onUpdatePages={onUpdatePages}
          onEditPage={onEditPage}
          confirm={confirm}
          notify={notify}
          selectedPageSlug={selectedPageSlug}
          onSelectPage={onSelectPage}
        />
      </div>

      {/* Visibility Toggles Footer */}
      <div 
        className="toolkit-visibility-footer"
        style={{
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          background: 'var(--cms-panel-bg, #13141f)',
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
          padding: '8px 16px',
          flexShrink: 0
        }}
      >
        {/* Content Visibility */}
        <button 
          onClick={() => setContentVisibility(contentVisibility === 'full' ? 'low' : contentVisibility === 'low' ? 'hidden' : 'full')}
          style={{ 
            background: contentVisibility === 'full' ? 'var(--cms-input-bg)' : 'transparent', 
            color: contentVisibility === 'full' ? 'var(--cms-text)' : 'var(--cms-text-muted)', 
            border: '1px solid var(--glass-border)', 
            width: 38, 
            height: 38, 
            minWidth: 38, 
            minHeight: 38, 
            aspectRatio: '1 / 1', 
            borderRadius: '50%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative', 
            cursor: 'pointer',
            opacity: contentVisibility === 'hidden' ? 0.35 : 1,
            transition: 'all 0.18s ease',
            padding: 0
          }}
          title="Visibilitas Konten (Gambar / Teks)"
        >
          {contentVisibility === 'hidden' ? <EyeOff size={16} /> : <Eye size={16} />}
          <span style={{ 
            position: 'absolute', 
            bottom: -2, 
            right: -2, 
            background: 'var(--cms-card-bg)', 
            border: '1px solid var(--glass-border)', 
            borderRadius: '50%', 
            width: 16, 
            height: 16, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--cms-accent)'
          }}>
            <ImageIcon size={9} />
          </span>
        </button>

        {/* Sticker Visibility */}
        <button 
          onClick={() => setStickerVisibility(stickerVisibility === 'full' ? 'low' : stickerVisibility === 'low' ? 'hidden' : 'full')}
          style={{ 
            background: stickerVisibility === 'full' ? 'var(--cms-input-bg)' : 'transparent', 
            color: stickerVisibility === 'full' ? 'var(--cms-text)' : 'var(--cms-text-muted)', 
            border: '1px solid var(--glass-border)', 
            width: 38, 
            height: 38, 
            minWidth: 38, 
            minHeight: 38, 
            aspectRatio: '1 / 1', 
            borderRadius: '50%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative', 
            cursor: 'pointer',
            opacity: stickerVisibility === 'hidden' ? 0.35 : 1,
            transition: 'all 0.18s ease',
            padding: 0
          }}
          title="Visibilitas Stiker"
        >
          {stickerVisibility === 'hidden' ? <EyeOff size={16} /> : <Eye size={16} />}
          <span style={{ 
            position: 'absolute', 
            bottom: -2, 
            right: -2, 
            background: 'var(--cms-card-bg)', 
            border: '1px solid var(--glass-border)', 
            borderRadius: '50%', 
            width: 16, 
            height: 16, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#f59e0b'
          }}>
            <Sparkles size={9} />
          </span>
        </button>

        {/* Frame Visibility */}
        <button 
          onClick={() => setFrameVisibility(frameVisibility === 'full' ? 'low' : frameVisibility === 'low' ? 'hidden' : 'full')}
          style={{ 
            background: frameVisibility === 'full' ? 'var(--cms-input-bg)' : 'transparent', 
            color: frameVisibility === 'full' ? 'var(--cms-text)' : 'var(--cms-text-muted)', 
            border: '1px solid var(--glass-border)', 
            width: 38, 
            height: 38, 
            minWidth: 38, 
            minHeight: 38, 
            aspectRatio: '1 / 1', 
            borderRadius: '50%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative', 
            cursor: 'pointer',
            opacity: frameVisibility === 'hidden' ? 0.35 : 1,
            transition: 'all 0.18s ease',
            padding: 0
          }}
          title="Visibilitas Frame / Mockup"
        >
          {frameVisibility === 'hidden' ? <EyeOff size={16} /> : <Eye size={16} />}
          <span style={{ 
            position: 'absolute', 
            bottom: -2, 
            right: -2, 
            background: 'var(--cms-card-bg)', 
            border: '1px solid var(--glass-border)', 
            borderRadius: '50%', 
            width: 16, 
            height: 16, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#0ea5e9'
          }}>
            <Monitor size={9} />
          </span>
        </button>
      </div>

    </div>
  );
};

export default ToolkitSidebar;
