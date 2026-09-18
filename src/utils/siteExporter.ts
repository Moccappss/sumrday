/**
 * Enterprise Full Website JSON & Static Backup Exporter
 */
import { storage } from './storage';

export const exportFullWebsiteArchive = async (): Promise<void> => {
  try {
    const collections = [
      'porto_settings',
      'porto_biodata',
      'porto_services',
      'porto_projects',
      'porto_articles',
      'porto_testimonials',
      'porto_faq',
      'porto_pages',
      'porto_stickers',
      'porto_frames',
      'porto_bookings',
      'porto_booking_settings'
    ];

    const backupData: Record<string, any> = {
      exportedAt: new Date().toISOString(),
      version: '2.0-2026',
      generator: 'sumr.day Studio CMS Engine'
    };

    for (const key of collections) {
      backupData[key] = await storage.getItem(key, null);
    }

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `sumrday-complete-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error('Failed to export website archive:', err);
    throw err;
  }
};
