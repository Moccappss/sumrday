// src/utils/flashSaleHelper.ts
// Centralized, synchronized utility for Flash Sale & Pre-Order calculations across all pages

export interface FlashSaleData {
  isActive: boolean;
  discountPercent?: number;
  salePrice?: number;
  originalPrice?: number;
  startTime?: string; // ISO string
  endTime?: string;   // ISO string (exact timestamp)
  title?: string;
  stockLeft?: number;
  stockLimit?: number;
  soldCount?: number;
}

export interface PreOrderData {
  isPreOrder?: boolean;
  preOrderBatch?: string;
  preOrderEstimate?: string;
  preOrderQuota?: number;
  preOrderSold?: number;
  preOrderCloseDate?: string;
  preOrderDpAllowed?: boolean;
}

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSeconds: number;
  formatted: string;
}

/**
 * Format milliseconds into days, hours, minutes, seconds
 */
export function getFlashSaleTimeRemaining(endTimeStr?: string | null): TimeRemaining {
  if (!endTimeStr) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, totalSeconds: 0, formatted: '00:00:00' };
  }

  const endMs = new Date(endTimeStr).getTime();
  if (isNaN(endMs)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, totalSeconds: 0, formatted: '00:00:00' };
  }

  const nowMs = Date.now();
  const diffMs = endMs - nowMs;

  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, totalSeconds: 0, formatted: '00:00:00' };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatted = days > 0 
    ? `${days}h ${pad(hours)}:${pad(minutes)}:${pad(seconds)}` 
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    totalSeconds,
    formatted
  };
}

/**
 * Checks if a product has an active Flash Sale (matching absolute timestamp against now)
 */
export function isProductFlashSaleActive(product: any, globalShopSettings?: any): boolean {
  if (!product) return false;

  // 1. Check product-specific flash sale config
  const fs = product.flashSale;
  if (fs && fs.isActive) {
    if (fs.endTime) {
      const endMs = new Date(fs.endTime).getTime();
      if (!isNaN(endMs) && endMs > Date.now()) {
        return true;
      }
    } else {
      // If active without end time, assume active
      return true;
    }
  }

  // 2. Check global shop flash sale config if enabled
  const globalFs = globalShopSettings?.flashSale;
  if (globalFs && globalFs.isActive) {
    const endMs = globalFs.endTime ? new Date(globalFs.endTime).getTime() : 0;
    if (endMs > Date.now()) {
      // If global flash sale applies to all or product is in included list
      if (!globalFs.productIds || globalFs.productIds.length === 0 || globalFs.productIds.includes(product.id)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculates effective Flash Sale Price for a product
 */
export function getFlashSalePrice(product: any, globalShopSettings?: any): number {
  if (!product) return 0;
  const basePrice = Number(product.price) || 0;
  if (!isProductFlashSaleActive(product, globalShopSettings)) {
    return basePrice;
  }

  const fs = product.flashSale;
  if (fs && Number(fs.salePrice) > 0) {
    return Number(fs.salePrice);
  }

  if (fs && Number(fs.discountPercent) > 0) {
    return Math.max(0, Math.round(basePrice * (1 - Number(fs.discountPercent) / 100)));
  }

  const globalFs = globalShopSettings?.flashSale;
  if (globalFs && Number(globalFs.discountPercent) > 0) {
    return Math.max(0, Math.round(basePrice * (1 - Number(globalFs.discountPercent) / 100)));
  }

  return basePrice;
}

/**
 * Calculates Flash Sale discount percentage
 */
export function getFlashSaleDiscountPercent(product: any, globalShopSettings?: any): number {
  if (!product || !isProductFlashSaleActive(product, globalShopSettings)) return 0;

  const fs = product.flashSale;
  if (fs && Number(fs.discountPercent) > 0) {
    return Math.round(Number(fs.discountPercent));
  }

  const basePrice = Number(product.price) || 0;
  const salePrice = getFlashSalePrice(product, globalShopSettings);
  if (basePrice > 0 && salePrice < basePrice) {
    return Math.round(((basePrice - salePrice) / basePrice) * 100);
  }

  const globalFs = globalShopSettings?.flashSale;
  if (globalFs && Number(globalFs.discountPercent) > 0) {
    return Math.round(Number(globalFs.discountPercent));
  }

  return 0;
}

/**
 * Determines whether a product is a Pre-Order product (merch / PO batch)
 */
export function isPreOrderProduct(product: any): boolean {
  if (!product) return false;
  if (product.isPreOrder === true || product.type === 'Pre-Order' || product.type === 'PreOrder') return true;
  const cat = (product.category || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  return cat.includes('pre-order') || cat.includes('preorder') || name.includes('[po]') || name.includes('(po)');
}

/**
 * Calculates Pre-Order quota progress (sold vs quota)
 */
export function getPreOrderQuotaProgress(product: any): {
  sold: number;
  quota: number;
  percentage: number;
  isQuotaFull: boolean;
  isClosed: boolean;
} {
  const quota = Math.max(0, Number(product.preOrderQuota) || 50);
  const sold = Math.max(0, Number(product.preOrderSold) || 0);
  const percentage = quota > 0 ? Math.min(100, Math.round((sold / quota) * 100)) : 0;
  const isQuotaFull = quota > 0 && sold >= quota;

  let isClosed = false;
  if (product.preOrderCloseDate) {
    const closeMs = new Date(product.preOrderCloseDate).getTime();
    if (!isNaN(closeMs) && closeMs < Date.now()) {
      isClosed = true;
    }
  }

  return {
    sold,
    quota,
    percentage,
    isQuotaFull,
    isClosed
  };
}

/**
 * Get effective Flash Sale end time from product or global shop settings
 */
export function getEffectiveFlashSaleEndTime(product?: any, globalShopSettings?: any): string | null {
  if (product?.flashSale?.endTime) {
    return product.flashSale.endTime;
  }
  if (globalShopSettings?.flashSale?.endTime) {
    return globalShopSettings.flashSale.endTime;
  }
  return null;
}

/**
 * Dispatch event to sync all listeners across pages when Flash Sale updates
 */
export function notifyFlashSaleUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('porto_flash_sale_updated'));
  }
}
