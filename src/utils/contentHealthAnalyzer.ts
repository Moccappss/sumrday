import { callGemini } from './ai';
import { storage } from './storage';

export interface OptimizationCheck {
  id: string;
  label: string;
  passed: boolean;
  scoreWeight: number;
  impact: 'high' | 'medium' | 'low';
  tip: string;
  currentValue?: string | number;
}

export interface ContentAuditResult {
  id: string;
  title: string;
  type: 'blog' | 'portfolio' | 'catalog' | 'note';
  typeLabel: string;
  score: number; // 0 - 100
  grade: 'Sangat Optimal' | 'Cukup Optimal' | 'Perlu Perbaikan' | 'Kritis';
  gradeColor: string;
  checks: OptimizationCheck[];
  passedCount: number;
  totalChecks: number;
  wordCount: number;
  charCount: number;
  estimatedReadTimeMinutes: number;
  thumbnail?: string;
  editRoute: string;
  sourceItem: any;
}

// ── Text Strip Helper (HTML tags & extra spaces) ──
export function stripHtmlAndCountWords(htmlOrText: string = ''): { text: string; wordCount: number; charCount: number } {
  if (!htmlOrText) return { text: '', wordCount: 0, charCount: 0 };
  const clean = htmlOrText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = clean ? clean.split(/\s+/).filter(Boolean) : [];
  return {
    text: clean,
    wordCount: words.length,
    charCount: clean.length
  };
}

// ── Analyze Single Blog Post ──
export function analyzeBlogPost(post: any): ContentAuditResult {
  const title = String(post?.title || '').trim();
  const slug = String(post?.slug || '').trim();
  const metaDesc = String(post?.metaDescription || '').trim();
  const content = String(post?.content || '');
  const { wordCount, charCount } = stripHtmlAndCountWords(content);
  const thumbnail = post?.thumbnail || post?.coverImage || '';
  const category = String(post?.category || '').trim();
  const tags = post?.tags;
  const hasTags = Array.isArray(tags) ? tags.length > 0 : Boolean(tags && String(tags).trim().length > 0);
  
  const hasHeadings = /<h[2-4][^>]*>|##\s+/i.test(content);
  const isSlugSeoFriendly = slug.length > 3 && /^[a-z0-9-]+$/.test(slug);

  const checks: OptimizationCheck[] = [
    {
      id: 'title_length',
      label: 'Panjang Judul Artikel',
      passed: title.length >= 35 && title.length <= 70,
      scoreWeight: 20,
      impact: 'high',
      currentValue: `${title.length} Karakter`,
      tip: title.length < 35 
        ? 'Judul terlalu pendek (< 35 karakter). Buat lebih spesifik & menarik agar CTR pencarian naik.'
        : title.length > 70 
        ? 'Judul terlalu panjang (> 70 karakter) dan berisiko terpotong di hasil pencarian Google.'
        : 'Panjang judul sangat ideal untuk SEO Google (35-70 karakter).'
    },
    {
      id: 'meta_description',
      label: 'Meta Description (Snippet)',
      passed: metaDesc.length >= 100 && metaDesc.length <= 165,
      scoreWeight: 20,
      impact: 'high',
      currentValue: `${metaDesc.length} Karakter`,
      tip: metaDesc.length === 0
        ? 'Meta description belum diisi! Wajib diisi ringkasan 120-160 karakter untuk pratinjau Google & media sosial.'
        : metaDesc.length < 100
        ? 'Meta description terlalu singkat (< 100 karakter). Jelaskan manfaat artikel lebih detail.'
        : metaDesc.length > 165
        ? 'Meta description melebihi 165 karakter dan akan terpotong (...) di SERP Google.'
        : 'Panjang meta description sudah sangat optimal (100-165 karakter).'
    },
    {
      id: 'content_depth',
      label: 'Kedalaman Isi Artikel',
      passed: wordCount >= 300,
      scoreWeight: 20,
      impact: 'high',
      currentValue: `${wordCount} Kata`,
      tip: wordCount < 150
        ? 'Artikel sangat tipis (< 150 kata). Tambahkan penjelasan atau studi kasus agar dinilai berkualitas oleh pembaca & search engine.'
        : wordCount < 300
        ? 'Isi artikel masih tergolong singkat (< 300 kata). Tambahkan sub-bab atau tips praktis.'
        : 'Kedalaman konten sangat bagus (>= 300 kata).'
    },
    {
      id: 'headings_structure',
      label: 'Struktur Sub-Judul (H2 / H3)',
      passed: hasHeadings,
      scoreWeight: 15,
      impact: 'medium',
      tip: hasHeadings
        ? 'Hierarki heading (H2/H3) rapi memudahkan skimming pembaca.'
        : 'Belum ada Sub-Judul (H2/H3). Pecah artikel ke beberapa bab menggunakan Heading 2/3 agar enak dibaca.'
    },
    {
      id: 'thumbnail_presence',
      label: 'Gambar Sampul (Thumbnail)',
      passed: Boolean(thumbnail && thumbnail.startsWith('http')),
      scoreWeight: 15,
      impact: 'medium',
      tip: thumbnail
        ? 'Thumbnail resolusi tinggi sudah terpasang.'
        : 'Belum ada thumbnail sampul. Pasang gambar menarik untuk meningkatkan rasio klik & share visual.'
    },
    {
      id: 'url_slug_taxonomy',
      label: 'Struktur URL Slug & Kategori',
      passed: isSlugSeoFriendly && Boolean(category && category !== 'Umum'),
      scoreWeight: 10,
      impact: 'low',
      tip: isSlugSeoFriendly && category && category !== 'Umum'
        ? `Slug bersih & kategori spesifik: [${category}].`
        : 'Pastikan slug hanya huruf kecil & tanda hubung, serta tentukan kategori yang spesifik (bukan Umum).'
    }
  ];

  const totalScore = checks.reduce((acc, c) => acc + (c.passed ? c.scoreWeight : 0), 0);
  const passedCount = checks.filter(c => c.passed).length;

  let grade: ContentAuditResult['grade'] = 'Kritis';
  let gradeColor = '#ef4444';
  if (totalScore >= 85) {
    grade = 'Sangat Optimal';
    gradeColor = '#10b981';
  } else if (totalScore >= 70) {
    grade = 'Cukup Optimal';
    gradeColor = '#3b82f6';
  } else if (totalScore >= 50) {
    grade = 'Perlu Perbaikan';
    gradeColor = '#f59e0b';
  }

  return {
    id: post?.id || `blog_${Math.random()}`,
    title: title || 'Artikel Tanpa Judul',
    type: 'blog',
    typeLabel: 'Artikel Blog',
    score: totalScore,
    grade,
    gradeColor,
    checks,
    passedCount,
    totalChecks: checks.length,
    wordCount,
    charCount,
    estimatedReadTimeMinutes: Math.max(1, Math.round(wordCount / 180)),
    thumbnail,
    editRoute: '/admin/blog',
    sourceItem: post
  };
}

// ── Analyze Portfolio Project ──
export function analyzePortfolioProject(item: any): ContentAuditResult {
  const title = String(item?.title || item?.name || '').trim();
  const desc = String(item?.description || item?.about || item?.story || '');
  const { wordCount, charCount } = stripHtmlAndCountWords(desc);
  const thumbnail = item?.image || item?.thumbnail || item?.cover || '';
  const category = String(item?.category || '').trim();
  const tags = item?.tags;
  const hasTags = Array.isArray(tags) ? tags.length > 0 : Boolean(tags && String(tags).trim().length > 0);
  const clientName = item?.client || item?.clientName;
  const hasLiveLink = Boolean(item?.link || item?.demoUrl || item?.url);

  const checks: OptimizationCheck[] = [
    {
      id: 'title_clarity',
      label: 'Nama Proyek & Branding',
      passed: title.length >= 10 && title.length <= 60,
      scoreWeight: 25,
      impact: 'high',
      currentValue: `${title.length} Karakter`,
      tip: title.length < 10 
        ? 'Nama karya terlalu singkat (< 10 karakter). Sebutkan nama brand atau lingkup desainnya.'
        : 'Nama proyek proporsional dan jelas.'
    },
    {
      id: 'story_depth',
      label: 'Cerita / Narasi Studi Kasus',
      passed: wordCount >= 30,
      scoreWeight: 25,
      impact: 'high',
      currentValue: `${wordCount} Kata`,
      tip: wordCount < 30
        ? 'Deskripsi karya sangat singkat. Ceritakan latar belakang tantangan klien & solusi visual yang dihadirkan.'
        : 'Studi kasus karya terisi dengan baik.'
    },
    {
      id: 'visual_showcase',
      label: 'Asset Visual / Mockup Utama',
      passed: Boolean(thumbnail && thumbnail.startsWith('http')),
      scoreWeight: 25,
      impact: 'high',
      tip: thumbnail
        ? 'Gambar mockup visual terpasang.'
        : 'Karya belum memiliki gambar mockup/thumbnail utama.'
    },
    {
      id: 'tags_category',
      label: 'Kategori & Tag Layanan',
      passed: Boolean(category) && hasTags,
      scoreWeight: 15,
      impact: 'medium',
      tip: Boolean(category) && hasTags
        ? 'Kategori dan tag keterampilan lengkap untuk filter pencarian klien.'
        : 'Tambahkan kategori dan beberapa tag relevan (e.g. Branding, UI/UX, Motion).'
    },
    {
      id: 'social_proof_link',
      label: 'Kredensial Klien / Live Preview',
      passed: Boolean(clientName || hasLiveLink),
      scoreWeight: 10,
      impact: 'low',
      tip: Boolean(clientName || hasLiveLink)
        ? 'Dilengkapi nama klien atau tautan hasil karya langsung.'
        : 'Sertakan nama klien atau tautan live preview untuk meningkatkan kredibilitas.'
    }
  ];

  const totalScore = checks.reduce((acc, c) => acc + (c.passed ? c.scoreWeight : 0), 0);
  const passedCount = checks.filter(c => c.passed).length;

  let grade: ContentAuditResult['grade'] = 'Kritis';
  let gradeColor = '#ef4444';
  if (totalScore >= 85) {
    grade = 'Sangat Optimal';
    gradeColor = '#10b981';
  } else if (totalScore >= 70) {
    grade = 'Cukup Optimal';
    gradeColor = '#3b82f6';
  } else if (totalScore >= 50) {
    grade = 'Perlu Perbaikan';
    gradeColor = '#f59e0b';
  }

  return {
    id: item?.id || `porto_${Math.random()}`,
    title: title || 'Karya Portofolio',
    type: 'portfolio',
    typeLabel: 'Portofolio Karya',
    score: totalScore,
    grade,
    gradeColor,
    checks,
    passedCount,
    totalChecks: checks.length,
    wordCount,
    charCount,
    estimatedReadTimeMinutes: 1,
    thumbnail,
    editRoute: '/admin/portfolio',
    sourceItem: item
  };
}

// ── Analyze Catalog Product ──
export function analyzeCatalogProduct(prod: any): ContentAuditResult {
  const title = String(prod?.name || prod?.title || '').trim();
  const desc = String(prod?.description || prod?.desc || '');
  const { wordCount, charCount } = stripHtmlAndCountWords(desc);
  const thumbnail = prod?.image || prod?.thumbnail || (Array.isArray(prod?.images) ? prod.images[0] : '');
  const price = Number(prod?.price || 0);
  const category = String(prod?.category || '').trim();
  const hasDigitalAsset = Boolean(prod?.downloadUrl || prod?.fileUrl || prod?.instantDownload);

  const checks: OptimizationCheck[] = [
    {
      id: 'prod_title',
      label: 'Nama Produk Jelas & Menjual',
      passed: title.length >= 10 && title.length <= 60,
      scoreWeight: 25,
      impact: 'high',
      currentValue: `${title.length} Karakter`,
      tip: title.length < 10 ? 'Nama produk terlalu singkat.' : 'Nama produk menarik dan jelas.'
    },
    {
      id: 'prod_pricing',
      label: 'Penetapan Harga (Pricing)',
      passed: price > 0,
      scoreWeight: 25,
      impact: 'high',
      currentValue: price > 0 ? `Rp ${price.toLocaleString('id-ID')}` : 'Gratis / Belum Diatur',
      tip: price > 0 ? 'Harga terkonfigurasi dengan valid.' : 'Harga produk belum ditentukan atau 0.'
    },
    {
      id: 'prod_desc',
      label: 'Rincian & Manfaat Produk',
      passed: wordCount >= 20,
      scoreWeight: 20,
      impact: 'medium',
      currentValue: `${wordCount} Kata`,
      tip: wordCount >= 20 ? 'Deskripsi lengkap menjelaskan apa yang didapat pembeli.' : 'Tambahkan poin spesifikasi/fitur yang diperoleh pembeli.'
    },
    {
      id: 'prod_image',
      label: 'Foto Produk / Pratinjau',
      passed: Boolean(thumbnail && thumbnail.startsWith('http')),
      scoreWeight: 20,
      impact: 'medium',
      tip: thumbnail ? 'Foto produk terpasang jelas.' : 'Wajib tambahkan foto produk / thumbnail mockup beresolusi tinggi.'
    },
    {
      id: 'prod_delivery',
      label: 'Kategori / Pengiriman File',
      passed: Boolean(category) || hasDigitalAsset,
      scoreWeight: 10,
      impact: 'low',
      tip: Boolean(category) || hasDigitalAsset ? 'Pengelompokan kategori / instant delivery siap.' : 'Tentukan kategori katalog agar mudah ditemukan pembeli.'
    }
  ];

  const totalScore = checks.reduce((acc, c) => acc + (c.passed ? c.scoreWeight : 0), 0);
  const passedCount = checks.filter(c => c.passed).length;

  let grade: ContentAuditResult['grade'] = 'Kritis';
  let gradeColor = '#ef4444';
  if (totalScore >= 85) grade = 'Sangat Optimal', gradeColor = '#10b981';
  else if (totalScore >= 70) grade = 'Cukup Optimal', gradeColor = '#3b82f6';
  else if (totalScore >= 50) grade = 'Perlu Perbaikan', gradeColor = '#f59e0b';

  return {
    id: prod?.id || `cat_${Math.random()}`,
    title: title || 'Produk Katalog',
    type: 'catalog',
    typeLabel: 'Produk Katalog',
    score: totalScore,
    grade,
    gradeColor,
    checks,
    passedCount,
    totalChecks: checks.length,
    wordCount,
    charCount,
    estimatedReadTimeMinutes: 1,
    thumbnail,
    editRoute: '/admin/catalog',
    sourceItem: prod
  };
}

// ── Analyze Note & Concept Draft ──
export function analyzeNoteDraft(note: any): ContentAuditResult {
  const title = String(note?.title || '').trim();
  const content = String(note?.content || '');
  const { wordCount, charCount } = stripHtmlAndCountWords(content);
  const checklist = Array.isArray(note?.checklist) ? note.checklist : [];
  const clientName = String(note?.clientName || '').trim();
  const isApproved = note?.clientApprovalStatus === 'approved';

  const checks: OptimizationCheck[] = [
    {
      id: 'note_title',
      label: 'Judul Konsep / Memo',
      passed: title.length >= 8,
      scoreWeight: 25,
      impact: 'high',
      tip: title.length >= 8 ? 'Judul konsep jelas.' : 'Beri nama konsep yang jelas dan spesifik.'
    },
    {
      id: 'note_content',
      label: 'Kelengkapan Brief Konsep',
      passed: wordCount >= 15,
      scoreWeight: 25,
      impact: 'high',
      currentValue: `${wordCount} Kata`,
      tip: wordCount >= 15 ? 'Brief konsep terisi.' : 'Tuliskan poin-poin penjelasan konsep atau arahan kreatif.'
    },
    {
      id: 'note_todos',
      label: 'Action Items (To-Do Checklist)',
      passed: checklist.length >= 1,
      scoreWeight: 25,
      impact: 'medium',
      currentValue: `${checklist.length} Tugas`,
      tip: checklist.length >= 1 ? `${checklist.length} action items siap dieksekusi.` : 'Tambahkan to-do checklist agar siap dikonversi ke Proyek Kanban.'
    },
    {
      id: 'note_client_info',
      label: 'Target Klien & Akses Preview',
      passed: Boolean(clientName || note?.pinCode || isApproved),
      scoreWeight: 25,
      impact: 'medium',
      tip: Boolean(clientName || note?.pinCode || isApproved) 
        ? `Terkait klien [${clientName || 'ACC'}] dengan proteksi preview.` 
        : 'Tentukan nama klien tujuan atau aktifkan PIN pratinjau.'
    }
  ];

  const totalScore = checks.reduce((acc, c) => acc + (c.passed ? c.scoreWeight : 0), 0);
  const passedCount = checks.filter(c => c.passed).length;

  let grade: ContentAuditResult['grade'] = 'Kritis';
  let gradeColor = '#ef4444';
  if (totalScore >= 85) grade = 'Sangat Optimal', gradeColor = '#10b981';
  else if (totalScore >= 70) grade = 'Cukup Optimal', gradeColor = '#3b82f6';
  else if (totalScore >= 50) grade = 'Perlu Perbaikan', gradeColor = '#f59e0b';

  return {
    id: note?.id || `note_${Math.random()}`,
    title: title || 'Catatan Konsep',
    type: 'note',
    typeLabel: 'Catatan / Draf',
    score: totalScore,
    grade,
    gradeColor,
    checks,
    passedCount,
    totalChecks: checks.length,
    wordCount,
    charCount,
    estimatedReadTimeMinutes: 1,
    editRoute: '/admin/notes',
    sourceItem: note
  };
}

/**
 * 🪄 One-Click AI Auto-Fix Engine
 * Memperbaiki masalah SEO & diagnostik konten secara cerdas menggunakan Gemini AI
 */
export async function autoFixContentIssue(
  item: any,
  type: 'blog' | 'portfolio' | 'catalog' | 'note',
  checkId: string
): Promise<{ success: boolean; message: string; updatedItem?: any }> {
  try {
    const clone = JSON.parse(JSON.stringify(item));
    let fixedField = '';

    if (checkId === 'meta_description' || checkId === 'catalog_desc' || checkId === 'summary') {
      const title = clone.title || clone.name || 'Konten Studio';
      const prompt = `Buat 1 paragraf meta description yang memikat, ramah SEO, dan profesional berbahasa Indonesia untuk judul: "${title}". Panjang karakter WAJIB antara 120 hingga 150 karakter. Keluarkan HANYA teks meta deskripsi polos tanpa tanda kutip.`;
      const generated = await callGemini(prompt, 'Anda adalah pakar SEO profesional.', 100);
      const cleanDesc = generated.trim().replace(/^["']|["']$/g, '').slice(0, 160);
      
      if (type === 'blog') clone.metaDescription = cleanDesc;
      else if (type === 'catalog') clone.description = cleanDesc;
      else if (type === 'portfolio') clone.summary = cleanDesc;
      else if (type === 'note') clone.content = (clone.content ? clone.content + '\n\n' : '') + cleanDesc;
      
      fixedField = 'Meta description berhasil dioptimalkan!';
    } else if (checkId === 'tags_presence' || checkId === 'catalog_tags') {
      const title = clone.title || clone.name || 'Studio';
      const prompt = `Berikan 4 tag/kata kunci terbaik untuk konten berjudul "${title}". Pisahkan setiap tag HANYA dengan koma. Contoh: branding, desain, web, bisnis`;
      const generated = await callGemini(prompt, 'Anda adalah pakar metadata dan tag.', 60);
      const tagsArray = generated.split(',').map((t: string) => t.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')).filter(Boolean);
      clone.tags = tagsArray;
      fixedField = `Berhasil menambahkan ${tagsArray.length} tag SEO!`;
    } else if (checkId === 'title_length') {
      const title = clone.title || clone.name || '';
      const prompt = `Judul "${title}" terlalu ${title.length < 35 ? 'pendek' : 'panjang'}. Tolong perbaiki agar panjangnya pas antara 40 hingga 60 karakter, memikat, dan memiliki nilai CTR tinggi. Keluarkan HANYA judul pengganti tanpa tanda kutip.`;
      const generated = await callGemini(prompt, 'Anda adalah pakar copywriting judul.', 80);
      clone.title = generated.trim().replace(/^["']|["']$/g, '');
      fixedField = 'Judul berhasil disesuaikan dengan standar SEO Google!';
    } else if (checkId === 'headings_structure') {
      if (type === 'blog' && clone.content) {
        const prompt = `Teks berikut belum memiliki sub-heading (H2). Sisipkan 2 sub-heading H2 bertanda '## ' yang relevan dan rapi di dalam teks berikut:\n\n${clone.content.slice(0, 1500)}`;
        const generated = await callGemini(prompt, 'Anda adalah editor artikel profesional.', 1500);
        clone.content = generated.trim();
        fixedField = 'Struktur sub-heading H2 berhasil disisipkan!';
      } else {
        return { success: false, message: 'Sub-heading hanya dapat disisipkan pada artikel blog.' };
      }
    } else if (checkId === 'note_todos') {
      const title = clone.title || 'Brief Proyek';
      const prompt = `Berdasarkan topik catatan "${title}", buatkan 3 to-do checklist praktis. Format setiap baris: - [ ] nama tugas`;
      const generated = await callGemini(prompt, 'Anda adalah asisten manajemen proyek.', 200);
      clone.checklist = generated.split('\n').filter((l: string) => l.includes('- [ ]')).map((l: string, i: number) => ({
        id: `td_${Date.now()}_${i}`,
        text: l.replace('- [ ]', '').trim(),
        completed: false
      }));
      fixedField = 'To-do checklist cerdas berhasil di-generate!';
    } else {
      return { success: false, message: 'Diagnostik ini memerlukan peninjauan manual.' };
    }

    // Simpan ke storage sesuai tipe
    clone.updatedAt = new Date().toISOString();
    let storageKey = '';
    if (type === 'blog') storageKey = 'porto_blog_posts';
    else if (type === 'portfolio') storageKey = 'porto_projects';
    else if (type === 'catalog') storageKey = 'porto_catalog_products';
    else if (type === 'note') storageKey = 'porto_memo_notes';

    if (storageKey) {
      const existing = await storage.getItem(storageKey, []);
      if (Array.isArray(existing)) {
        const idx = existing.findIndex((x: any) => x.id === clone.id);
        if (idx !== -1) {
          existing[idx] = clone;
        } else {
          existing.unshift(clone);
        }
        await storage.setItem(storageKey, existing);
        window.dispatchEvent(new Event('porto_storage_dirty'));
      }
    }

    return { success: true, message: fixedField, updatedItem: clone };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal memperbaiki otomatis.' };
  }
}

