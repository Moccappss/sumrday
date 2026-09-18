import React, { createContext, useContext, useState } from 'react';

const CmsContext = createContext();

export const CmsProvider = ({ children }) => {
  const [cmsMode, setCmsMode] = useState('dashboard'); // 'dashboard', 'pages', 'content', 'sticker', 'frame'
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [selectedStickerId, setSelectedStickerId] = useState(null);
  const [selectedPageSlug, setSelectedPageSlug] = useState(null);
  const [contentVisibility, setContentVisibility] = useState('full');
  const [stickerVisibility, setStickerVisibility] = useState('low');
  const [frameVisibility, setFrameVisibility] = useState('full');
  const [activeSidebar, setActiveSidebar] = useState(null);

  const value = {
    cmsMode, setCmsMode,
    selectedBlockId, setSelectedBlockId,
    selectedStickerId, setSelectedStickerId,
    selectedPageSlug, setSelectedPageSlug,
    contentVisibility, setContentVisibility,
    stickerVisibility, setStickerVisibility,
    frameVisibility, setFrameVisibility,
    activeSidebar, setActiveSidebar
  };

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
};

export const useCms = () => {
  const context = useContext(CmsContext);
  if (!context) {
    throw new Error('useCms must be used within a CmsProvider');
  }
  return context;
};
