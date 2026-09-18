/**
 * Enterprise Utility for Cloudinary Uploads, AI Transformations & Client-side WebP Compression
 */
import { storage } from './storage';
import { googleSync } from './googleSync';
import { CLOUDINARY_CONFIG } from '../config/AppConfig';

export interface CloudinaryMediaResult {
  url: string;
  public_id: string;
  resource_type: string;
  format: string;
  name: string;
  createdAt?: number;
}

/**
 * AI Transformation Types supported by Cloudinary
 */
export type CloudinaryAiPreset = 
  | 'enhance'           // e_improve: auto-colors, contrast & clarity
  | 'bg-remove'         // e_background_removal: AI transparent background
  | 'upscale'           // e_upscale: AI Super-Resolution 2x-4x
  | 'smart-crop'        // c_fill,g_auto: AI subject-aware auto centering
  | 'face-crop'         // c_thumb,g_face: AI facial focus thumbnail
  | 'shadow'            // e_dropshadow: AI commercial drop shadow
  | 'retouch'           // e_camera:face_retouch: AI skin and facial retouch
  | 'gen-fill';         // b_gen_fill: AI generative expand

/**
 * Apply Cloudinary AI Transformations directly to any Cloudinary image URL
 */
export const applyCloudinaryAi = (
  url: string,
  aiType: CloudinaryAiPreset,
  params: { width?: number; height?: number } = {}
): string => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return url;
  }

  const transformMap: Record<CloudinaryAiPreset, string> = {
    'enhance': 'e_improve,f_auto,q_auto',
    'bg-remove': 'e_background_removal,f_auto,q_auto',
    'upscale': 'e_upscale,f_auto,q_auto',
    'smart-crop': `c_fill,g_auto${params.width ? `,w_${params.width}` : ''}${params.height ? `,h_${params.height}` : ''},f_auto,q_auto`,
    'face-crop': `c_thumb,g_face${params.width ? `,w_${params.width}` : ''}${params.height ? `,h_${params.height}` : ''},f_auto,q_auto`,
    'shadow': 'e_dropshadow,f_auto,q_auto',
    'retouch': 'e_camera:face_retouch,f_auto,q_auto',
    'gen-fill': 'b_gen_fill,c_pad,f_auto,q_auto',
  };

  const transform = transformMap[aiType] || 'f_auto,q_auto';

  // If URL already has /upload/, inject the AI transformation segment
  if (url.includes('/upload/')) {
    // Avoid double applying the same transformation
    if (url.includes(transform)) return url;
    return url.replace('/upload/', `/upload/${transform}/`);
  }

  return url;
};

/**
 * Generates an optimized Cloudinary URL with auto-format (AVIF/WebP) and adaptive compression
 */
export const getOptimizedCloudinaryUrl = (
  url: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'thumb' | 'fit' | 'limit' | 'pad';
    gravity?: 'auto' | 'face' | 'center';
    quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco';
    format?: 'auto' | 'webp' | 'png' | 'jpg';
    aiEnhance?: boolean;
    aiBgRemove?: boolean;
  } = {}
): string => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return url;
  }

  const transformations: string[] = [];

  if (options.aiBgRemove) transformations.push('e_background_removal');
  if (options.aiEnhance) transformations.push('e_improve');

  const crop = options.crop || (options.width || options.height ? 'fill' : undefined);
  if (crop) transformations.push(`c_${crop}`);

  const gravity = options.gravity || (crop ? 'auto' : undefined);
  if (gravity) transformations.push(`g_${gravity}`);

  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);

  transformations.push(`f_${options.format || 'auto'}`);
  transformations.push(`q_${options.quality || 'auto'}`);

  const transformStr = transformations.join(',');

  if (url.includes('/upload/')) {
    return url.replace(/\/upload\/(?:[a-zA-Z0-9_,:]+\/)?/, `/upload/${transformStr}/`);
  }

  return url;
};

/**
 * Client-Side Image Compressor
 * Converts large JPEG/PNG files to optimized WebP
 */
const compressImage = async (
  fileOrBase64: File | Blob | string,
  maxWidth: number = 1600,
  quality: number = 0.85
): Promise<File | Blob | string> => {
  return new Promise((resolve) => {
    let isBase64 = false;
    let mimeType = '';
    let src = '';

    if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:')) {
      isBase64 = true;
      const match = fileOrBase64.match(/data:([^;]+);/);
      mimeType = match ? match[1] : 'image/jpeg';
      src = fileOrBase64;
    } else if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
      mimeType = fileOrBase64.type;
    } else {
      return resolve(fileOrBase64);
    }

    // Skip vector SVG and animated GIF
    if (!mimeType.startsWith('image/') || mimeType === 'image/svg+xml' || mimeType === 'image/gif') {
      return resolve(fileOrBase64);
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(fileOrBase64);

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(fileOrBase64);

          if (isBase64) {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(fileOrBase64);
            reader.readAsDataURL(blob);
          } else {
            const originalName = (fileOrBase64 as File).name || 'image';
            const baseName = originalName.includes('.')
              ? originalName.substring(0, originalName.lastIndexOf('.'))
              : originalName;
            const compressedFile = new File([blob], `${baseName}.webp`, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => resolve(fileOrBase64);

    if (isBase64) {
      img.src = src;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(fileOrBase64);
      reader.readAsDataURL(fileOrBase64 as Blob);
    }
  });
};

// Convert File / Blob to Data URL helper
const fileToDataUrl = (file: File | Blob | string): Promise<string> => {
  if (typeof file === 'string') return Promise.resolve(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const makeSafeMediaResult = (res: CloudinaryMediaResult): CloudinaryMediaResult => {
  const safe = { ...res };
  Object.defineProperty(safe, 'toString', {
    value: () => safe.url,
    writable: true,
    enumerable: false
  });
  return safe;
};

export const uploadToCloudinary = async (
  file: File | Blob | string | null,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto',
  aiOptions?: {
    aiEnhance?: boolean;
    aiBgRemove?: boolean;
  }
): Promise<CloudinaryMediaResult | null> => {
  if (!file) return null;

  let processedFile: any = file;
  try {
    processedFile = await compressImage(file);
  } catch (err) {
    console.warn('[Cloudinary] Kompresi gagal, mengunggah berkas asli:', err);
  }

  const settings = (await storage.getItem('porto_settings', {})) || {};
  // Priority: localStorage override → AppConfig (env / hardcode)
  const CLOUD_NAME    = settings.cloudinaryName   || CLOUDINARY_CONFIG.cloudName;
  const UPLOAD_PRESET = settings.cloudinaryPreset || CLOUDINARY_CONFIG.uploadPreset;

  const fileName = (file as File)?.name || (typeof file === 'string' ? 'media_berkas' : 'file');
  const fileExt = fileName.includes('.') ? fileName.split('.').pop() || 'webp' : 'webp';

  const saveToGallery = async (mediaObj: CloudinaryMediaResult) => {
    try {
      const currentGallery = (await storage.getItem('porto_media_gallery', [])) || [];
      const newMedia = {
        id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        ...mediaObj,
        createdAt: Date.now()
      };
      await storage.setItem('porto_media_gallery', [newMedia, ...currentGallery]);
      window.dispatchEvent(new CustomEvent('porto_media_uploaded', { detail: newMedia }));
    } catch (e) {
      console.warn('Failed to save to media gallery history:', e);
    }
  };

  // ── TIER 1: CLOUDINARY UPLOAD ──
  try {
    const formData = new FormData();
    formData.append('file', processedFile);
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (data && data.secure_url) {
      let optimizedUrl = data.secure_url;
      
      const transformations: string[] = [];
      if (aiOptions?.aiBgRemove) transformations.push('e_background_removal');
      if (aiOptions?.aiEnhance) transformations.push('e_improve');
      transformations.push('f_auto,q_auto');

      if (optimizedUrl.includes('/upload/')) {
        optimizedUrl = optimizedUrl.replace('/upload/', `/upload/${transformations.join(',')}/`);
      }

      const mediaResult: CloudinaryMediaResult = {
        url: optimizedUrl,
        public_id: data.public_id,
        resource_type: data.resource_type || (resourceType === 'video' ? 'video' : 'image'),
        format: data.format || fileExt,
        name: processedFile.name || fileName
      };
      await saveToGallery(mediaResult);
      return makeSafeMediaResult(mediaResult);
    } else {
      console.warn('[Upload] Cloudinary menolak upload, beralih ke jalur cadangan:', data?.error?.message);
    }
  } catch (error: any) {
    console.warn('[Upload] Cloudinary tidak dapat dijangkau, mencoba jalur cadangan:', error.message || error);
  }

  // ── TIER 2: GOOGLE DRIVE VAULT (APPS SCRIPT) ──
  if (settings.googleAppsScriptUrl) {
    try {
      console.info('[Upload] Mencoba unggah berkas ke Google Drive...');
      const driveUrl = await googleSync.uploadFileToDrive(file, null, 'Gallery_Uploads');
      if (driveUrl) {
        const driveResult: CloudinaryMediaResult = {
          url: driveUrl,
          public_id: `drive_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          resource_type: resourceType === 'video' ? 'video' : 'image',
          format: fileExt,
          name: fileName
        };
        await saveToGallery(driveResult);
        return makeSafeMediaResult(driveResult);
      }
    } catch (driveErr) {
      console.warn('[Upload] Google Drive upload gagal, beralih ke penyimpanan lokal:', driveErr);
    }
  }

  // ── TIER 3: OFFLINE / LOCAL WEBP DATA URL (ZERO FAILURE GUARANTEE) ──
  try {
    console.info('[Upload] Menyimpan media secara instan ke Cache Lokal (WebP)...');
    const localDataUrl = await fileToDataUrl(processedFile);
    const localResult: CloudinaryMediaResult = {
      url: localDataUrl,
      public_id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      resource_type: resourceType === 'video' ? 'video' : 'image',
      format: 'webp',
      name: fileName
    };
    await saveToGallery(localResult);
    return makeSafeMediaResult(localResult);
  } catch (localErr: any) {
    console.error('[Upload] Seluruh jalur penyimpanan gagal:', localErr);
    throw new Error('Gagal memproses berkas media: ' + (localErr.message || 'Format tidak didukung'));
  }
};

export const uploadAudioToCloudinary = async (file: File | null): Promise<CloudinaryMediaResult | null> => {
  if (!file) return null;

  const settings = (await storage.getItem('porto_settings', {})) || {};
  // Priority: localStorage override → AppConfig (env / hardcode)
  const CLOUD_NAME    = settings.cloudinaryName   || CLOUDINARY_CONFIG.cloudName;
  const UPLOAD_PRESET = settings.cloudinaryPreset || CLOUDINARY_CONFIG.uploadPreset;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('resource_type', 'video');

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
      { method: 'POST', body: formData }
    );
    const data = await response.json();

    if (data.secure_url) {
      return {
        url: data.secure_url,
        public_id: data.public_id,
        resource_type: data.resource_type,
        format: data.format,
        name: file.name || 'audio'
      };
    } else {
      throw new Error(data.error?.message || 'Gagal upload audio ke Cloudinary');
    }
  } catch (error: any) {
    throw new Error('Gagal upload audio: ' + (error.message || error));
  }
};
