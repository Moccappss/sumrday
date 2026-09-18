/**
 * AI Utility - Ultra-Fast & Context-Aware Engine
 * Optimized for Gemini 2.0 Flash / 1.5 Flash with sub-second response times & Smart Token Cache
 */
import { AI_CONFIG, STORAGE_KEYS } from '../config/AppConfig';

// In-flight request deduplicator to prevent redundant simultaneous API calls
const inFlightRequests = new Map<string, Promise<string>>();

// In-memory quick cache for instant response (0ms, 0 tokens)
const aiMemoryCache = new Map<string, { text: string; timestamp: number }>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Fast deterministic hash for cache key generation
 */
const generateCacheKey = (prompt: string, systemInstruction: string, maxTokens: number): string => {
  const str = `${prompt.trim()}_${systemInstruction.trim()}_${maxTokens}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `porto_ai_cache_${hash}`;
};

export const getGeminiKey = (): string => {
  // 1. Runtime override via localStorage (diatur dari Settings UI)
  let key = localStorage.getItem(STORAGE_KEYS.geminiKey) || localStorage.getItem('porto_gemini_key') || '';
  if (!key) {
    try {
      const rawSettings = localStorage.getItem(STORAGE_KEYS.settings);
      if (rawSettings) {
        const s = JSON.parse(rawSettings);
        key = s.geminiApiKey || s.aiConfig?.geminiKey || '';
        if (key) localStorage.setItem(STORAGE_KEYS.geminiKey, key);
      }
    } catch {
      // Ignore localStorage parse errors
    }
  }
  // 2. Fallback ke AppConfig (env / hardcode)
  return key || AI_CONFIG.geminiApiKey;
};

export const PRIORITY_MODELS: string[] = [...AI_CONFIG.priorityModels];

// Cache verified working model — validated against current PRIORITY_MODELS
// Jika model cache sudah tidak ada di list (misal dihapus karena deprecated),
// abaikan cache agar tidak terjadi error "model not found"
const _rawCached = typeof sessionStorage !== 'undefined'
  ? (sessionStorage.getItem(STORAGE_KEYS.cachedModel) || null)
  : null;
let cachedWorkingModel: string | null = (_rawCached && (PRIORITY_MODELS as string[]).includes(_rawCached))
  ? _rawCached
  : null;

// Bersihkan sessionStorage jika cache tidak valid
if (_rawCached && !cachedWorkingModel) {
  try { sessionStorage.removeItem(STORAGE_KEYS.cachedModel); } catch {}
}



/**
 * Test Gemini API Key connectivity and measure response latency
 */
export const testGeminiConnection = async (customKey?: string): Promise<{
  success: boolean;
  model: string;
  message: string;
  latencyMs: number;
}> => {
  const key = (customKey || getGeminiKey()).trim();
  if (!key) {
    return {
      success: false,
      model: '-',
      message: 'API Key belum diisi.',
      latencyMs: 0
    };
  }

  const startTime = Date.now();
  let lastErrMsg = '';

  for (const model of PRIORITY_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Ping test. Balas 1 kata: Siap.' }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
      });

      const latencyMs = Date.now() - startTime;
      if (res.ok) {
        cachedWorkingModel = model;
        try { sessionStorage.setItem('porto_cached_gemini_model', model); } catch {}
        return {
          success: true,
          model,
          message: `Koneksi Google Gemini API Aktif (${model})`,
          latencyMs
        };
      }

      const errData = await res.json().catch(() => ({}));
      lastErrMsg = errData.error?.message || `HTTP ${res.status}`;

      if (res.status === 400 && lastErrMsg.toLowerCase().includes('api key not valid')) {
        return {
          success: false,
          model,
          message: 'Kunci API Google Gemini tidak valid. Pastikan Anda menyalin API Key yang benar dari Google AI Studio.',
          latencyMs
        };
      }
      if (res.status === 429) {
        return {
          success: false,
          model,
          message: 'Batas kuota gratis Google Gemini terlampaui (429 Rate Limit). Coba beberapa saat lagi.',
          latencyMs
        };
      }
    } catch (err: any) {
      lastErrMsg = err.message || 'Gagal menghubungi server';
    }
  }

  return {
    success: false,
    model: '-',
    message: `Koneksi Terkendala: ${lastErrMsg}`,
    latencyMs: Date.now() - startTime
  };
};

/**
 * Get user profile persona from storage to make AI answers hyper-relevant
 */
export const getUserPersonaContext = (): string => {
  try {
    const rawSettings = localStorage.getItem('porto_settings');
    const settings = rawSettings ? JSON.parse(rawSettings) : {};
    const bio = settings.biodata || {};
    return `Konteks Profil Pengguna:
- Nama: ${bio.fullName || 'Mochamad Saiful Arif'}
- Peran/Profesi: ${bio.role || 'Desainer Grafis & Web Kreatif'}
- Lokasi: ${bio.location || 'Indonesia'}
- Bio: ${bio.bio || 'Desainer grafis dan kreator digital profesional.'}
Gunakan gaya bahasa yang percaya diri, profesional, ramah, dan terstruktur rapi.`;
  } catch {
    return "Gunakan gaya bahasa profesional, ramah, dan terstruktur rapi.";
  }
};

/**
 * Core Gemini API Caller with Smart Token Cache & sub-second execution
 */
export const callGemini = async (
  prompt: string, 
  systemInstruction: string = "",
  maxTokens: number = 1500,
  bypassCache: boolean = false
): Promise<string> => {
  const apiKey = getGeminiKey();
  if (!apiKey || apiKey.length < 10) {
    return "API Key belum diatur! Silakan atur Google Gemini API Key di menu Pengaturan -> AI & Automasi.";
  }

  const trimmedPrompt = prompt.trim();
  const persona = getUserPersonaContext();
  const fullSystemInstruction = systemInstruction 
    ? `${systemInstruction}\n\n${persona}`
    : `Kamu adalah asisten AI cerdas untuk sistem manajemen konten & portofolio bisnis.\n${persona}`;

  const cacheKey = generateCacheKey(trimmedPrompt, fullSystemInstruction, maxTokens);

  // 1. Check in-memory / sessionStorage cache to save 100% tokens for repeat calls
  if (!bypassCache) {
    const cachedMemory = aiMemoryCache.get(cacheKey);
    if (cachedMemory && (Date.now() - cachedMemory.timestamp < CACHE_TTL_MS)) {
      return cachedMemory.text;
    }
    if (typeof sessionStorage !== 'undefined') {
      try {
        const rawSession = sessionStorage.getItem(cacheKey);
        if (rawSession) {
          const parsed = JSON.parse(rawSession);
          if (parsed && (Date.now() - (parsed.timestamp || 0) < CACHE_TTL_MS) && parsed.text) {
            aiMemoryCache.set(cacheKey, parsed);
            return parsed.text;
          }
        }
      } catch {
        // Ignore session storage error
      }
    }
  }

  // 2. In-flight request deduplication
  if (inFlightRequests.has(cacheKey)) {
    return await inFlightRequests.get(cacheKey)!;
  }

  const executeCall = async (): Promise<string> => {
    const modelsToTry = cachedWorkingModel 
      ? [cachedWorkingModel, ...PRIORITY_MODELS.filter(m => m !== cachedWorkingModel)]
      : PRIORITY_MODELS;

    let lastError = "";

    for (const model of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const payload = {
          system_instruction: {
            parts: [{ text: fullSystemInstruction }]
          },
          contents: [{
            parts: [{ text: trimmedPrompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: maxTokens
          }
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.status === 429) {
          return "⚠️ Kuota API Gemini terlampaui (429 Rate Limit). Silakan coba kembali dalam beberapa saat.";
        }

        if (response.status === 404 || response.status === 400) {
          const legacyPayload = {
            contents: [{
              parts: [{ text: `${fullSystemInstruction}\n\nUSER REQUEST: ${trimmedPrompt}` }]
            }]
          };
          const legacyRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(legacyPayload)
          });
          if (legacyRes.ok) {
            const legacyData = await legacyRes.json();
            const text = legacyData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              cachedWorkingModel = model;
              sessionStorage.setItem('porto_cached_gemini_model', model);
              
              // Store in token cache
              const entry = { text, timestamp: Date.now() };
              aiMemoryCache.set(cacheKey, entry);
              try { sessionStorage.setItem(cacheKey, JSON.stringify(entry)); } catch {}
              return text;
            }
          }
          const errorData = await response.json().catch(() => ({}));
          lastError = errorData.error?.message || `HTTP ${response.status}`;
          continue;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          lastError = errorData.error?.message || `HTTP ${response.status}`;
          continue;
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          cachedWorkingModel = model;
          sessionStorage.setItem('porto_cached_gemini_model', model);
          
          // Store in token cache
          const entry = { text: generatedText, timestamp: Date.now() };
          aiMemoryCache.set(cacheKey, entry);
          try { sessionStorage.setItem(cacheKey, JSON.stringify(entry)); } catch {}
          return generatedText;
        }
      } catch (err: any) {
        lastError = err.message || "Gagal menghubungi server Gemini.";
      }
    }

    return `Koneksi AI Terkendala: ${lastError}. Silakan periksa kembali API Key Anda.`;
  };

  const promise = executeCall().finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, promise);
  return await promise;
};

/**
 * Specialized AI Generator for Notes & Task Lists
 */
export const generateAiNote = async (prompt: string, templateType: string = "general"): Promise<string> => {
  let instruction = `Kamu adalah pembuat catatan, dokumen kerja, dan task planner profesional.
Buat catatan kerja yang sangat lengkap, praktis, rapi, dan mudah dieksekusi.

ATURAN FORMAT WAJIB:
1. Baris pertama WAJIB berupa Judul Utama memakai format: # Judul Catatan
2. Gunakan Subheading ## untuk membagi tahapan atau topik.
3. Untuk daftar tugas / to-do list, WAJIB gunakan format checklist markdown:
   - [ ] Tugas 1 yang jelas dan spesifik
   - [ ] Tugas 2
   - [x] Langkah awal yang sudah dipersiapkan
4. Tambahkan catatan atau tips penting menggunakan format callout:
   > Catatan: Tips atau instruksi penting di sini.
5. JANGAN GUNAKAN EMOJI SAMA SEKALI. Gunakan format teks profesional, bersih, dan rapi.
6. Gunakan bahasa Indonesia yang santun, profesional, dan modern.
7. Hindari teks pembuka/penutup basa-basi, langsung keluarkan isi catatan dari baris # Judul.`;

  const templateMap: Record<string, string> = {
    logo: `Fokus: Pembuatan Logo & Identitas Visual. Sertakan tahap Brief Klien, Riset & Moodboard, Sketsa Kasar, Vektorisasi Vektor, Presentasi Mockup, dan Serah Terima File Master.`,
    uiux: `Fokus: Desain UI/UX & Wireframe. Sertakan User Flow, Sketsa Wireframe Low-Fidelity, Design System & Komponen, Prototyping Interaktif, Usability Testing, dan Handoff Developer.`,
    social_media: `Fokus: Aset Desain Media Sosial & Promosi. Sertakan Konsep Visual Feed/Story/Carousel, Copywriting Headline, Spesifikasi Ukuran/Format, dan Jadwal Publikasi.`,
    client_reply: `Fokus: Komunikasi & Penanganan Klien. Sertakan Format Salam Pembuka, Inti Tanggapan Sopan, Checklist Hal yang Perlu Dikonfirmasi, dan Penutup Profesional.`,
    invoice_proposal: `Fokus: Proposal Biaya & Format Invoice. Sertakan Rincian Layanan/Scope of Work, Tabel Biaya & Termin Pembayaran, Rekening Tujuan, Ketentuan Layanan, dan Batas Waktu Pembayaran.`,
    handoff_sop: `Fokus: SOP Serah Terima & Finalisasi Proyek. Sertakan Checklist Kelengkapan File, Surat Serah Terima Hak Cipta, Panduan Penggunaan, dan Formulir Review/Testimoni Klien.`,
    todo_sprint: `Fokus: Sprint To-Do List Harian / Mingguan. Bagi tugas ke dalam Prioritas Tinggi, Prioritas Sedang, dan Prioritas Rutin dengan checkbox markdown spesifik.`,
    project_plan: `Fokus: Manajemen Proyek & Timeline. Sertakan Milestone Utama, Jadwal Pengerjaan per Fase, Deliverables, Dependencies, dan Kriteria Keberhasilan.`,
    qa_checklist: `Fokus: Checklist Quality Assurance (QA) & Final Review. Sertakan Pengecekan Typo/Ejaan, Konsistensi Warna & Grid, Responsivitas Desain, Resolusi Aset, dan Validasi Link/Tombol.`,
    content_calendar: `Fokus: Kalender Konten & Editorial. Sertakan Pilar Konten, Ide Topik per Minggu, Call-to-Action (CTA), Format Konten, dan Metrik Evaluasi.`,
    case_study: `Fokus: Studi Kasus Portofolio Lengkap. Sertakan Latar Belakang Klien, Masalah/Tantangan Utama, Proses Riset & Solusi Desain, Visual/Wireframe, dan Hasil Akhir/Dampak Bisnis.`,
    copywriting: `Fokus: Copywriting Iklan & Penawaran Jasa. Gunakan Kerangka AIDA atau PAS yang persuasif dan konvertif.`,
    travel: `Fokus: Rencana Perjalanan / Itinerary. Sertakan Jadwal Harian, Rekomendasi Spot & Kuliner, Estimasi Anggaran, serta Checklist Barang Bawaan & Dokumen.`,
    study_plan: `Fokus: Rencana Belajar / Upgrade Skill. Sertakan Target Kemampuan, Kurikulum Pembelajaran Mingguan, Referensi Belajar/Tools, Proyek Latihan Praktis, dan Indikator Penguasaan.`
  };

  if (templateMap[templateType]) {
    instruction += `\n${templateMap[templateType]}`;
  }

  return await callGemini(prompt, instruction, 1200);
};

export interface AiProjectResult {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  estimatedDays?: number;
  tasks?: string[];
  notes?: string;
  error?: string;
}

/**
 * Specialized AI Generator for Project Management
 */
export const generateAiProject = async (prompt: string, templateType: string = "general"): Promise<AiProjectResult> => {
  const instruction = `Kamu adalah Manajer Proyek (Project Manager) profesional kelas dunia untuk proyek bertipe "${templateType}".
Tugasmu adalah merancang rencana proyek yang matang, realistis, dan terstruktur.

WAJIB KELUARKAN HASIL HANYA DALAM FORMAT JSON BERSIH TANPA TEKS LAIN (VALID JSON ONLY):
{
  "title": "Judul Proyek Jelas dan Profesional",
  "description": "Deskripsi komprehensif mengenai latar belakang, tujuan, dan ruang lingkup proyek.",
  "priority": "high",
  "tags": ["Tag1", "Tag2"],
  "estimatedDays": 14,
  "tasks": [
    "Nama sub-task 1 yang spesifik dan dapat dieksekusi",
    "Nama sub-task 2",
    "Nama sub-task 3",
    "Nama sub-task 4",
    "Nama sub-task 5"
  ],
  "notes": "Catatan ringkas SOP, standar kualitas, dan hal penting yang harus diperhatikan."
}

JANGAN GUNAKAN EMOJI SAMA SEKALI. Pastikan JSON valid dan dapat di-parse dengan JSON.parse.`;

  const rawRes = await callGemini(prompt, instruction, 800);
  if (!rawRes || rawRes.startsWith('API Key belum') || rawRes.startsWith('Koneksi AI Terkendala') || rawRes.startsWith('⚠️')) {
    return { error: rawRes };
  }

  try {
    const cleanJson = rawRes.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    return parsed;
  } catch {
    return {
      title: prompt.slice(0, 50),
      description: rawRes.slice(0, 300),
      priority: 'medium',
      tags: ['Project'],
      estimatedDays: 14,
      tasks: ['Brief awal & riset', 'Eksekusi desain/development', 'Review internal', 'Final delivery'],
      notes: rawRes
    };
  }
};

/**
 * AI Helper to generate additional subtasks for an existing project
 */
export const generateAiProjectTasks = async (projectTitle: string, projectDesc: string): Promise<string[]> => {
  const instruction = `Sebagai Project Manager, buatkan 5 sampai 8 sub-task penting dan spesifik untuk proyek ini.
KELUARKAN HANYA ARRAY JSON VALID BERISI STRING:
["Sub-task 1", "Sub-task 2", "Sub-task 3", "Sub-task 4", "Sub-task 5"]
JANGAN gunakan emoji dan jangan ada teks di luar array JSON.`;

  const prompt = `Proyek: ${projectTitle}\nDeskripsi: ${projectDesc || 'Proyek kreatif'}`;
  const rawRes = await callGemini(prompt, instruction, 400);
  try {
    const cleanJson = rawRes.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const tasks = JSON.parse(cleanJson);
    if (Array.isArray(tasks)) return tasks;
    return [];
  } catch {
    return [];
  }
};

/**
 * Specialized AI Generator for Website / Landing Page Data
 */
export const generateAiWebsite = async (prompt: string, templateType: string = "portfolio"): Promise<any> => {
  const instruction = `Kamu adalah Web Architect & Creative Director kelas dunia untuk tipe website "${templateType}".
Tugasmu adalah merancang konten dan struktur website landing page yang berkonversi tinggi, profesional, dan berestetika modern.

WAJIB KELUARKAN HASIL HANYA DALAM FORMAT JSON BERSIH TANPA TEKS LAIN (VALID JSON ONLY):
{
  "hero": {
    "greeting": "Salam pembuka",
    "headline": "Nama Brand / Headline Kuat",
    "subheadline": "Peran / Keahlian Utama",
    "description": "Deskripsi persuasif 1-2 kalimat yang menarik calon klien.",
    "ctaPrimaryLabel": "Lihat Portofolio",
    "ctaPrimaryUrl": "#portfolio",
    "ctaSecondaryLabel": "Konsultasi Gratis",
    "ctaSecondaryUrl": "#contact",
    "cards": [
      { "id": "card-1", "text": "Pencapaian / Keunggulan 1", "icon": "Award" },
      { "id": "card-2", "text": "Pencapaian / Keunggulan 2", "icon": "Trophy" }
    ],
    "badge": {
      "active": true,
      "smallText": "STATUS",
      "largeText": "Buka Proyek Baru"
    }
  },
  "profile": {
    "bio": "Bio singkat profesional.",
    "fullBio": "Cerita latar belakang keahlian, filosofi kerja, dan komitmen kualitas.",
    "skills": [
      { "id": "sk-1", "name": "Keahlian 1", "description": "Penjelasan ringkas.", "icon": "PenTool" },
      { "id": "sk-2", "name": "Keahlian 2", "description": "Penjelasan ringkas.", "icon": "Figma" }
    ]
  },
  "process": [
    { "id": "proc-1", "title": "Riset & Brief", "description": "Memahami visi dan kebutuhan pasar secara mendalam.", "icon": "Search" },
    { "id": "proc-2", "title": "Strategi & Konsep", "description": "Menyusun kerangka kerja dan arah visual.", "icon": "Lightbulb" }
  ],
  "testimonials": [
    { "id": "test-1", "quote": "Testimoni memukau dari klien nyata.", "author": "Nama Klien 1", "role": "CEO, Perusahaan A", "avatar": "" }
  ],
  "theme": {
    "accentColor": "#6366f1",
    "defaultMode": "light"
  },
  "seo": {
    "metaTitle": "Nama Brand — Judul SEO Profesional",
    "metaDescription": "Deskripsi SEO yang padat dan menarik calon pengunjung di Google."
  },
  "localization": {
    "portfolioSectionTitle": "— KARYA TERPILIH",
    "portfolioMainTitle": "Studi Kasus & Proyek",
    "aboutSectionTitle": "— TENTANG KAMI",
    "aboutMainTitle": "Membangun Citra & Solusi Nyata",
    "processSectionTitle": "— ALUR KERJA",
    "processMainTitle": "Bagaimana Kami Bekerja",
    "testimonialSectionTitle": "— TESTIMONI",
    "testimonialMainTitle": "Kepuasan Klien Kami",
    "customProjectSectionTitle": "— MULAI KOLABORASI",
    "customProjectMainTitle": "Wujudkan Ide Anda Bersama Kami",
    "customProjectSubtitle": "Diskusikan kebutuhan proyek Anda dan dapatkan penawaran terbaik.",
    "customProjectCta": "Hubungi Kami",
    "footerReadyText": "Siap meningkatkan level bisnis Anda?",
    "footerStartProject": "Mulai Proyek"
  }
}

JANGAN GUNAKAN EMOJI SAMA SEKALI. Pastikan JSON valid dan sesuai format di atas.`;

  const rawRes = await callGemini(prompt, instruction, 1500);
  if (!rawRes || rawRes.startsWith('API Key belum') || rawRes.startsWith('Koneksi AI Terkendala') || rawRes.startsWith('⚠️')) {
    return { error: rawRes };
  }

  try {
    const cleanJson = rawRes.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    return parsed;
  } catch {
    return {
      error: "Gagal memproses respons AI. Coba gunakan deskripsi yang lebih spesifik atau gunakan Template Offline."
    };
  }
};

/**
 * Specialized AI Generator for Blog & Articles
 */
export const generateAiBlogPost = async (prompt: string, templateType: string = "general"): Promise<any> => {
  const instruction = `Kamu adalah Penulis Artikel & Konten Kreator Profesional (Senior Content Writer & SEO Specialist) dengan gaya "${templateType}".
Tugasmu adalah membuat draf artikel blog berkualitas tinggi, menarik, berwawasan luas, dan terstruktur rapi dengan tag HTML standar (h2, h3, p, ul, li, blockquote, strong, em).

WAJIB KELUARKAN HASIL HANYA DALAM FORMAT JSON BERSIH TANPA TEKS LAIN (VALID JSON ONLY):
{
  "title": "Judul Artikel Menarik dan SEO-Friendly",
  "category": "Teknologi",
  "slug": "judul-artikel-menarik",
  "excerpt": "Ringkasan singkat artikel dalam 1-2 kalimat untuk preview pembaca.",
  "content": "<h2>Pengantar</h2><p>Paragraf pembuka yang menarik dan relevan.</p><h2>Pembahasan Utama</h2><p>Ulasan mendalam dengan penjelasan jelas.</p><blockquote>Kutipan inspiratif atau inti pemikiran dari artikel ini.</blockquote><h3>Langkah-Langkah & Strategi</h3><ul><li><strong>Poin Kunci 1:</strong> Penjelasan praktis.</li><li><strong>Poin Kunci 2:</strong> Penjelasan praktis.</li></ul><h2>Kesimpulan & Tips Tindakan</h2><p>Penutup yang memberikan rekomendasi nyata bagi pembaca.</p>",
  "tags": "Panduan, Tips, Inovasi",
  "metaTitle": "Judul Artikel — Wawasan & Panduan Lengkap",
  "metaDescription": "Deskripsi SEO padat maks 155 karakter yang mengundang klik di mesin pencari.",
  "readTime": 4
}

JANGAN GUNAKAN EMOJI SAMA SEKALI. Pastikan konten HTML kaya dan terstruktur rapi.`;

  const rawRes = await callGemini(prompt, instruction, 2000);
  if (!rawRes || rawRes.startsWith('API Key belum') || rawRes.startsWith('Koneksi AI Terkendala') || rawRes.startsWith('⚠️')) {
    return { error: rawRes };
  }

  try {
    const cleanJson = rawRes.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    return parsed;
  } catch {
    return {
      error: "Gagal memproses artikel AI. Coba gunakan deskripsi yang lebih spesifik atau gunakan Template Offline."
    };
  }
};

/**
 * Specialized AI Generator for Page Hero Headers
 */
export const generateAiPageHeader = async (pageKey: string, currentValues: any = {}, customPrompt: string = ""): Promise<any> => {
  const pageNames: Record<string, string> = {
    blog: 'Halaman Blog & Artikel',
    portfolio: 'Halaman Portofolio & Proyek Kreatif',
    catalog: 'Halaman Katalog Produk & Layanan Bisnis',
    about: 'Halaman Profil & Tentang Saya',
    links: 'Halaman Hub Tautan & Media Sosial',
    landing: 'Halaman Utama / Landing Page'
  };

  const pageName = pageNames[pageKey] || `Halaman ${pageKey}`;

  const instruction = `Kamu adalah Creative Copywriter & Brand Strategist Kelas Dunia.
Tugasmu adalah membuat teks Hero Header yang sangat berkelas, memukau, modern, dan profesional untuk: ${pageName}.

FORMAT OUTPUT WAJIB JSON BERSIH TANPA TEKS LAIN:
{
  "badge": "Teks lencana pendek maks 4 kata (contoh: JURNAL & PUBLIKASI ARTIKEL)",
  "title": "Judul headline utama yang berbobot dan elegan",
  "highlight": "2 atau 3 kata terakhir dari judul yang akan diberi efek warna gradasi",
  "description": "Deskripsi pengantar yang elegan, padat, dan menarik bagi pengunjung."
}

JANGAN GUNAKAN EMOJI SAMA SEKALI. Gunakan bahasa Indonesia baku dan bernuansa eksklusif.`;

  const userPrompt = customPrompt || `Tolong buatkan teks hero header yang menarik dan profesional untuk ${pageName}. Judul saat ini: "${currentValues.title || ''}", Deskripsi saat ini: "${currentValues.description || ''}".`;

  const rawRes = await callGemini(userPrompt, instruction, 400);
  if (!rawRes || rawRes.startsWith('API Key belum') || rawRes.startsWith('Koneksi AI Terkendala') || rawRes.startsWith('⚠️')) {
    return { error: rawRes };
  }

  try {
    const cleanJson = rawRes.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    return parsed;
  } catch {
    return {
      error: "Gagal memproses respons AI. Coba gunakan deskripsi yang lebih spesifik atau gunakan Template Offline."
    };
  }
};

/**
 * Specialized AI Generator for Custom Landing Pages with Modular Sections & Navbar Groups
 */
export const generateAiCustomPage = async (prompt: string, pageTopic: string = "Landing Page"): Promise<any> => {
  const instruction = `Kamu adalah Senior Web Designer & Conversion Rate Optimization (CRO) Specialist.
Tugasmu adalah merancang satu set lengkap Halaman Kustom (Custom Landing Page) dengan blok-blok modular berkualitas tinggi bertopik "${pageTopic}".

PILIHAN TIPE BLOK MODULAR YANG DAPAT KAMU GUNAKAN:
- "text": Teks artikel / penjelasan konsep (title, subtitle, content, quote, quoteAuthor)
- "features": Fitur & solusi unggulan (title, subtitle, items: [{title, desc}])
- "pricing": Daftar paket harga (title, subtitle, plans: [{name, price, isPopular, features: []}])
- "faq": Tanya jawab umum (title, subtitle, faqs: [{question, answer}])
- "stats": Statistik angka pencapaian (title, subtitle, items: [{value, label}])
- "testimonials": Ulasan klien (title, subtitle, items: [{name, role, quote, rating: 5}])
- "process": Langkah alur kerja (title, subtitle, steps: [{number: "01", title, desc}])
- "cta": Banner ajakan aksi (title, subtitle, buttonText)

FORMAT OUTPUT WAJIB JSON BERSIH:
{
  "title": "Nama Halaman Keren",
  "subtitle": "Deskripsi singkat mengenai isi halaman",
  "metaTitle": "Nama Halaman — Judul SEO",
  "metaDescription": "Deskripsi SEO yang ramah mesin pencari",
  "sections": [
    {
      "id": "sec_1",
      "type": "features",
      "title": "Keunggulan Utama",
      "subtitle": "Mengapa memilih layanan kami",
      "items": [
        { "title": "Solusi Cepat", "desc": "Pengerjaan efisien sesuai standar." },
        { "title": "Kualitas Premium", "desc": "Hasil visual berkelas internasional." }
      ]
    },
    {
      "id": "sec_2",
      "type": "process",
      "title": "Alur Pengerjaan",
      "subtitle": "Tahapan mudah menuju hasil terbaik",
      "steps": [
        { "number": "01", "title": "Konsultasi & Brief", "desc": "Diskusikan kebutuhan Anda." },
        { "number": "02", "title": "Desain & Revisi", "desc": "Proses kreatif terarah." },
        { "number": "03", "title": "Peluncuran", "desc": "Serah terima aset siap pakai." }
      ]
    },
    {
      "id": "sec_3",
      "type": "cta",
      "title": "Siap Mewujudkan Proyek Anda?",
      "subtitle": "Hubungi tim kami hari ini dan dapatkan penawaran spesial.",
      "buttonText": "Mulai Konsultasi"
    }
  ]
}

JANGAN GUNAKAN EMOJI SAMA SEKALI. Pastikan JSON valid.`;

  const rawRes = await callGemini(prompt, instruction, 1500);
  if (!rawRes || rawRes.startsWith('API Key belum') || rawRes.startsWith('Koneksi AI Terkendala') || rawRes.startsWith('⚠️')) {
    return { error: rawRes };
  }

  try {
    const cleanJson = rawRes.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleanJson);
  } catch {
    return {
      error: "Gagal memproses data halaman kustom dari AI. Coba gunakan instruksi yang lebih terperinci."
    };
  }
};

