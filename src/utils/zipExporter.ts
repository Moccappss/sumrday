import JSZip from 'jszip';

export interface ZipFileItem {
  name: string;
  url?: string;
  downloadUrl?: string;
  [key: string]: any;
}

/**
 * Downloads multiple files and bundles them into a single .zip file.
 */
export async function downloadFilesAsZip(
  files: ZipFileItem[],
  zipFileName: string = 'project-deliverables.zip',
  onProgress?: (percent: number, currentItem: string) => void
): Promise<boolean> {
  if (!files || files.length === 0) {
    throw new Error('Tidak ada berkas untuk diunduh');
  }

  const zip = new JSZip();
  let completed = 0;
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    const fileUrl = item.downloadUrl || item.url;
    const fileName = item.name || `file_${i + 1}`;

    if (!fileUrl) continue;

    if (onProgress) {
      onProgress(Math.round((completed / total) * 100), fileName);
    }

    try {
      const response = await fetch(fileUrl, {
        mode: 'cors',
        headers: {}
      });

      if (!response.ok) {
        throw new Error(`Gagal mengunduh ${fileName} (${response.status})`);
      }

      const blob = await response.blob();
      zip.file(fileName, blob);
    } catch (err) {
      console.warn(`[ZIP Exporter] Gagal memuat berkas langsung: ${fileName}. Mencoba menambahkan tautan:`, err);
      // Fallback: If CORS blocks binary download, add a URL shortcut or text descriptor so nothing is lost
      zip.file(`${fileName}.url.txt`, `Link Unduh: ${fileUrl}\nNama: ${fileName}`);
    }

    completed++;
    if (onProgress) {
      onProgress(Math.round((completed / total) * 100), fileName);
    }
  }

  if (onProgress) {
    onProgress(95, 'Mengompresi berkas ZIP...');
  }

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  // Trigger browser download
  const blobUrl = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = zipFileName.endsWith('.zip') ? zipFileName : `${zipFileName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

  if (onProgress) {
    onProgress(100, 'Selesai');
  }

  return true;
}
