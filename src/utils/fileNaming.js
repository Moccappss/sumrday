export const generateFileName = (pageName, index, originalName, mediaType) => {
  const parts = (originalName || '').split('.');
  const extension = parts.length > 1 ? parts.pop().toLowerCase() : (mediaType === 'video' ? 'mp4' : 'jpg');
  const cleanPage = pageName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const sequence = String(index + 1).padStart(2, '0');
  
  // Example: home_01_image.jpg
  return `${cleanPage}_${sequence}_${mediaType}.${extension}`;
};

export const getUploadPath = (pageName, fileName) => {
  return `uploads/${pageName}/${fileName}`;
};

/**
 * Migration function to update existing database records to the new naming convention
 */
export const migrateExistingData = (pagesData) => {
  if (!pagesData || typeof pagesData !== 'object') return { updatedPages: pagesData || {}, changed: false };
  
  const updatedPages = { ...pagesData };
  let changed = false;

  Object.keys(updatedPages).forEach(pageKey => {
    if (Array.isArray(updatedPages[pageKey])) {
      updatedPages[pageKey] = updatedPages[pageKey].map((block, index) => {
        if (block && (block.url || block.urls?.length > 0) && block.mediaType !== 'youtube') {
          const mediaType = block.mediaType || 'image';
          const expectedName = generateFileName(pageKey, index, block.name, mediaType);
          
          if (block.name !== expectedName) {
            changed = true;
            return { ...block, name: expectedName };
          }
        }
        return block;
      });
    }
  });

  return { updatedPages, changed };
};
