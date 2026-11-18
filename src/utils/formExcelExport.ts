import type { FormSchema, FormResponse } from '../components/admin/form-maker/formTypes';
import { googleSync } from './googleSync';

/**
 * Membersihkan nama file dari karakter ilegal
 */
export const sanitizeFileName = (name: string): string => {
  return (name || 'Formulir')
    .replace(/[<>:"/\\|?*]/g, '_')
    .trim()
    .slice(0, 100);
};

/**
 * Menghasilkan file Excel (.xlsx) murni dalam bentuk Blob, Filename & Base64
 */
export const generateFormExcelBlob = async (
  form: FormSchema,
  responses: FormResponse[]
): Promise<{ blob: Blob; filename: string; base64: string }> => {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // 1. Definisikan Kolom Header
  const headers = ['Waktu Pengisian', 'ID Responden'];
  form.questions.forEach((q) => {
    headers.push(q.title || 'Pertanyaan Tanpa Judul');
  });

  // 2. Format Baris Data Tanggapan
  const rows: any[][] = [headers];

  responses.forEach((resp) => {
    const formattedDate = resp.submittedAt
      ? new Date(resp.submittedAt).toLocaleString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : '-';

    const rowData: any[] = [formattedDate, resp.id];

    form.questions.forEach((q) => {
      const val = resp.answers ? resp.answers[q.id] : undefined;
      if (val === undefined || val === null) {
        rowData.push('');
      } else if (Array.isArray(val)) {
        rowData.push(val.join(', '));
      } else if (typeof val === 'boolean') {
        rowData.push(val ? 'Ya' : 'Tidak');
      } else if (typeof val === 'object' && val !== null) {
        rowData.push(val.url ? `${val.name || 'Berkas'}: ${val.url}` : JSON.stringify(val));
      } else {
        rowData.push(String(val));
      }
    });

    rows.push(rowData);
  });

  // 3. Konversi ke Worksheet
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // 4. Hitung lebar kolom dinamis (Auto-Width)
  const colWidths = headers.map((header, colIndex) => {
    let maxLen = header.length;
    for (let r = 1; r < rows.length; r++) {
      const cellVal = rows[r][colIndex] ? String(rows[r][colIndex]) : '';
      if (cellVal.length > maxLen) {
        maxLen = cellVal.length;
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, 12), 50) };
  });
  ws['!cols'] = colWidths;

  // 5. Tambahkan worksheet ke workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Tanggapan');

  // 6. Buat binary array
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const blob = new Blob([excelBuffer], { type: mimeType });

  // 7. Hitung Base64 cepat dengan chunking buffer untuk keperluan Drive API
  let binary = '';
  const bytes = new Uint8Array(excelBuffer);
  const CHUNK_SIZE = 32768;
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  const base64 = btoa(binary);

  const rawTitle = sanitizeFileName(form.title || 'Formulir');
  const filename = `${rawTitle} (Tanggapan).xlsx`;

  return { blob, filename, base64 };
};

/**
 * Unduh langsung file Excel (.xlsx) ke komputer pengguna
 */
export const downloadFormExcel = async (
  form: FormSchema,
  responses: FormResponse[]
): Promise<boolean> => {
  try {
    const { blob, filename } = await generateFormExcelBlob(form, responses);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('[ExcelExport] Gagal download Excel:', err);
    return false;
  }
};

/**
 * Otomatis upload / simpan data formulir ke Google Drive sebagai file Excel (.xlsx)
 * File diberi nama sesuai nama form: "[Judul Form] (Tanggapan).xlsx"
 */
export const autoSaveFormExcelToDrive = async (
  form: FormSchema,
  responses: FormResponse[],
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void
): Promise<{ success: boolean; url?: string; message?: string }> => {
  try {
    const { blob, filename } = await generateFormExcelBlob(form, responses);
    const file = new File([blob], filename, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    if (notify) {
      notify(`⏳ Menyimpan file Excel "${filename}" ke Google Drive...`);
    }

    const driveUrl = await googleSync.uploadFileToDrive(file, undefined, 'Form_Responses');

    if (driveUrl) {
      if (notify) {
        notify(`✅ File Excel "${filename}" berhasil tersimpan di Google Drive!`, 'success');
      }
      return { success: true, url: driveUrl };
    }

    throw new Error('Gagal mendapatkan URL dari Google Drive');
  } catch (err: any) {
    console.error('[ExcelDriveSync] Error uploading Excel to Drive:', err);
    const errMsg = err?.message || 'Gagal menyimpan ke Google Drive';
    if (notify) {
      notify(`⚠️ ${errMsg}. Data form tetap tersimpan aman di database lokal.`, 'error');
    }
    return { success: false, message: errMsg };
  }
};
