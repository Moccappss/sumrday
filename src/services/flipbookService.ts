import { storage } from '../utils/storage';
import { ClientFlipbook, DEFAULT_FLIPBOOKS } from '../types/flipbook';

const STORAGE_KEY = 'porto_client_flipbooks';

export const getClientFlipbooks = async (forceCloud: boolean = false): Promise<ClientFlipbook[]> => {
  try {
    const list = await storage.getItem(STORAGE_KEY, DEFAULT_FLIPBOOKS, forceCloud);
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
    return DEFAULT_FLIPBOOKS;
  } catch (err) {
    console.error('Failed to get client flipbooks:', err);
    return DEFAULT_FLIPBOOKS;
  }
};

export const getClientFlipbookBySlugOrId = async (slugOrId: string): Promise<ClientFlipbook | null> => {
  try {
    const cleanKey = decodeURIComponent(slugOrId).trim().toLowerCase();
    const list = await getClientFlipbooks(false);
    let found = list.find(f => 
      f.id.toLowerCase() === cleanKey || 
      f.slug.toLowerCase() === cleanKey
    );
    if (!found) {
      const freshList = await getClientFlipbooks(true);
      found = freshList.find(f => 
        f.id.toLowerCase() === cleanKey || 
        f.slug.toLowerCase() === cleanKey
      );
    }
    return found || null;
  } catch (err) {
    console.error('Failed to find flipbook by slug or id:', err);
    return null;
  }
};

export const saveClientFlipbook = async (flipbook: ClientFlipbook): Promise<ClientFlipbook[]> => {
  const list = await getClientFlipbooks();
  const existingIndex = list.findIndex(f => f.id === flipbook.id);
  const now = new Date().toISOString();
  
  let updatedList: ClientFlipbook[];
  if (existingIndex >= 0) {
    updatedList = [...list];
    updatedList[existingIndex] = {
      ...flipbook,
      updatedAt: now
    };
  } else {
    updatedList = [
      {
        ...flipbook,
        createdAt: now,
        updatedAt: now
      },
      ...list
    ];
  }

  await storage.setItem(STORAGE_KEY, updatedList, true);
  window.dispatchEvent(new CustomEvent('porto_flipbooks_updated', { detail: updatedList }));
  return updatedList;
};

export const deleteClientFlipbook = async (id: string): Promise<ClientFlipbook[]> => {
  const list = await getClientFlipbooks();
  const updatedList = list.filter(f => f.id !== id);
  await storage.setItem(STORAGE_KEY, updatedList, true);
  window.dispatchEvent(new CustomEvent('porto_flipbooks_updated', { detail: updatedList }));
  return updatedList;
};

export const generateFlipbookShareUrl = (slugOrId: string): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sumr.day';
  return `${origin}/flipbook/${encodeURIComponent(slugOrId)}`;
};
