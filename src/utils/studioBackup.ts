import { storage } from './storage';

export interface StudioBackupData {
  version: string;
  app: string;
  timestamp: string;
  summary: Record<string, number>;
  data: Record<string, any>;
}

export const BACKUP_KEYS = [
  'porto_main_website',
  'porto_biodata',
  'porto_projects',
  'porto_transactions',
  'porto_catalog_products',
  'porto_catalog',
  'porto_shop_products',
  'porto_memo_notes',
  'porto_memos',
  'porto_memo_folders',
  'porto_portfolio',
  'porto_pages',
  'porto_settings',
  'porto_customers',
  'porto_stickers',
  'porto_frames',
  'porto_leads',
  'porto_trx_customers',
  'porto_trx_discounts',
  'porto_invoice_settings',
  'porto_custom_pages',
  'porto_business_profile',
  'porto_studio_inquiries',
  'porto_bio_links',
  'porto_links',
  'porto_forms',
  'porto_form_responses',
  'porto_rate_card',
  'porto_rate_cards',
  'porto_rate_card_addons',
  'porto_reviews',
  'porto_client_reviews',
  'porto_client_faqs',
  'porto_faqs',
  'porto_blogs',
  'porto_blog_posts',
  'porto_blog',
  'porto_media_vault',
  'porto_vault_folders',
  'porto_media_gallery',
  'porto_bookings',
  'porto_booking_settings',
  'porto_client_flipbooks',
  'porto_proofing_projects',
  'porto_deleted_customers',
  'porto_cms_snapshots',
  'porto_flash_sales',
  'porto_contracts_spk',
  'porto_partnerships',
  'porto_proofing_reviews',
  'porto_whatsapp_templates',
  'porto_client_vault_files',
  'porto_visitor_stats',
  'porto_project_reminders'
];

/**
 * Exports all core studio data into a single formatted JSON file.
 */
export async function exportStudioBackup(): Promise<string> {
  const backupObject: StudioBackupData = {
    version: '2.5.0',
    app: 'sumr.day Studio',
    timestamp: new Date().toISOString(),
    summary: {},
    data: {}
  };

  for (const key of BACKUP_KEYS) {
    try {
      const val = await storage.getItem(key, null);
      if (val !== null && val !== undefined) {
        backupObject.data[key] = val;
        backupObject.summary[key] = Array.isArray(val) ? val.length : (typeof val === 'object' ? Object.keys(val).length : 1);
      }
    } catch (e) {
      console.warn(`[StudioBackup] Error reading key ${key}:`, e);
    }
  }

  const jsonString = JSON.stringify(backupObject, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
  const fileName = `sumrday_backup_${dateStr}_${timeStr}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return fileName;
}

/**
 * Restores studio data from an exported JSON file.
 */
export async function restoreStudioBackup(
  file: File,
  onProgress?: (msg: string) => void
): Promise<{ success: boolean; restoredCount: number; message: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          throw new Error('Berkas backup kosong.');
        }

        const parsed = JSON.parse(text) as StudioBackupData;
        if (!parsed.data || typeof parsed.data !== 'object') {
          throw new Error('Format file backup tidak valid.');
        }

        onProgress?.('Memvalidasi dan mengimpor data...');

        let count = 0;
        const batch: Record<string, any> = {};

        for (const [key, val] of Object.entries(parsed.data)) {
          if (BACKUP_KEYS.includes(key)) {
            batch[key] = val;
            count++;
          }
        }

        if (count === 0) {
          throw new Error('Tidak ada data yang cocok untuk dipulihkan.');
        }

        await storage.batchSetItems(batch, true);

        // Notify app
        window.dispatchEvent(new Event('porto_saved'));
        window.dispatchEvent(new Event('porto_storage_synced'));

        resolve({
          success: true,
          restoredCount: count,
          message: `Berhasil memulihkan ${count} kategori data studio (${parsed.timestamp ? new Date(parsed.timestamp).toLocaleDateString() : 'Backup'}).`
        });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file dari disk.'));
    };

    reader.readAsText(file);
  });
}

export interface ContentSnapshotItem {
  id: string;
  timestamp: string;
  author: string;
  note: string;
  blockCount: number;
  pageCount: number;
  data: {
    porto_pages: any;
    porto_settings: any;
    porto_stickers: any;
    porto_frames: any;
  };
}

/**
 * Creates an automatic snapshot of visual builder/pages state.
 */
export async function createContentSnapshot(authorName = 'Admin', note = 'Penyimpanan Manual'): Promise<ContentSnapshotItem | null> {
  try {
    const [pages, settings, stickers, frames, existing] = await Promise.all([
      storage.getItem('porto_pages', {}),
      storage.getItem('porto_settings', {}),
      storage.getItem('porto_stickers', {}),
      storage.getItem('porto_frames', {}),
      storage.getItem<ContentSnapshotItem[]>('porto_cms_snapshots', [])
    ]);

    const blockCount = Object.values(pages || {}).reduce((acc: number, arr: any) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
    const pageCount = Object.keys(pages || {}).length + (Array.isArray((settings as any)?.customPages) ? (settings as any).customPages.length : 0);

    const newSnapshot: ContentSnapshotItem = {
      id: `snap_${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: authorName,
      note,
      blockCount,
      pageCount,
      data: {
        porto_pages: pages,
        porto_settings: settings,
        porto_stickers: stickers,
        porto_frames: frames
      }
    };

    // Keep only the latest 15 snapshots to prevent memory bloat
    const updated = [newSnapshot, ...(existing || [])].slice(0, 15);
    await storage.setItem('porto_cms_snapshots', updated, false);
    return newSnapshot;
  } catch (err) {
    console.warn('[createContentSnapshot] Error:', err);
    return null;
  }
}

/**
 * Restores a specific content snapshot.
 */
export async function restoreContentSnapshot(snapshotId: string): Promise<boolean> {
  try {
    const existing = await storage.getItem<ContentSnapshotItem[]>('porto_cms_snapshots', []);
    const target = (existing || []).find(s => s.id === snapshotId);
    if (!target || !target.data) return false;

    await storage.batchSetItems({
      'porto_pages': target.data.porto_pages,
      'porto_settings': target.data.porto_settings,
      'porto_stickers': target.data.porto_stickers,
      'porto_frames': target.data.porto_frames
    }, true);

    window.dispatchEvent(new Event('porto_saved'));
    window.dispatchEvent(new Event('porto_storage_synced'));
    return true;
  } catch (err) {
    console.error('[restoreContentSnapshot] Error:', err);
    return false;
  }
}

