# sumr.day — Unified UI/UX Design System & Architectural Standards

Dokumen ini merupakan panduan resmi standar desain antarmuka (UI) dan pengalaman pengguna (UX) untuk seluruh ekosistem **sumr.day OS** (Dashboard Admin CMS dan Website Publik). Seluruh komponen dan penambahan fitur baru **wajib** mematuhi spesifikasi desain ini agar tercapai konsistensi visual dan pengalaman navigasi yang presisi, rapi, dan cepat.

---

## 1. Skala Geometris Kelengkungan (Border Radius Hierarchy)

Prinsip dasar: **Semakin luar kontainer, semakin besar radius sudutnya. Elemen di dalam kontainer memiliki radius yang proporsional.**

| Tier | Token CSS | Nilai | Penggunaan Baku |
| :--- | :--- | :--- | :--- |
| **Tier 1 (Mega/Modal)** | `--cms-radius-xl` / `--cms-radius-2xl` | `20px` - `24px` | Jendela Modal dialog, Floating Drawer, Showcase Hero |
| **Tier 2 (Cards Utama)** | `--cms-radius-lg` / `--cms-card-radius` | `16px` | Kartu metrik KPI, Panel Kanvas, Container Tabel Utama |
| **Tier 3 (Sub-Cards)** | `--cms-radius-md` | `12px` - `14px` | Kartu rincian alur sesi, Kotak Accordion, Dropdown Menu |
| **Tier 4 (Controls)** | `--cms-radius-sm` / `--cms-input-radius` | `10px` | Form Input standar, Select dropdown, Stat Box kecil |
| **Tier 5 (Compact)** | `--cms-radius-xs` | `8px` | Compact input dalam tabel, Thumbnail galeri, Box item kecil |
| **Tier 6 (Full Pill)** | `--cms-radius-pill` / `--cms-radius-full` | `9999px` | Tab Pill, Filter Chip, Badge Status, Tombol Aksi, Search Bar |
| **Tier 7 (Circle)** | `border-radius: 50%` | `50%` | Circle Icon Buttons (`32px` / `28px`), Avatar pengguna |

---

## 2. Standarisasi Dimensi Elemen Form & Controls

Semua kontrol form memiliki tinggi, padding, dan ukuran teks yang seragam:

### A. Elemen Input & Formulir
* **Pill Search / Filter Toolbar:**
  * Tinggi: `38px` | Radius: `9999px` | Padding: `0 14px` | Font: `12.5px`
* **Standard Form Input (`.cms-input`):**
  * Tinggi: `38px` | Radius: `10px` | Padding: `0 12px` | Font: `13px` | Weight: `550`
* **Compact Input (Dalam Tabel/Modal Padat):**
  * Tinggi: `32px` | Radius: `8px` | Padding: `0 10px` | Font: `12px`
* **Form Select (`.cms-select`):**
  * Tinggi: `38px` | Radius: `10px` | Padding: `0 12px` | Font: `12.5px`
* **Textarea (`.cms-textarea`):**
  * Radius: `12px` | Padding: `10px 12px` | Font: `13px` | Min-height: `80px`

### B. Pills, Tabs & Badges
* **Pill Tabs Container (`.cms-pill-container`):**
  * Tinggi: `38px` | Radius: `9999px` | Padding: `3px` | Gap: `4px`
* **Pill Tab Button (`.cms-pill-tab`, `.cms-pill-filter`):**
  * Standar: Tinggi `32px` | Padding `0 14px` | Radius: `9999px` | Font: `12px (Bold 750)`
  * Kompak: Tinggi `26px` | Padding `0 10px` | Radius: `9999px` | Font: `11px (Bold 700)`
* **Status Badges & Tags (`.cms-badge`, `.status-pill`, `.cms-tag`):**
  * Tinggi: `22px` (atau padding `2px 8px`) | Radius: `9999px` | Font: `10.5px (Bold 750)` | Letter-spacing: `0.02em`

### C. Tombol (Buttons & Icon Triggers)
* **Standard Pill Button (`.cms-btn`):**
  * Tinggi: `36px` | Padding: `0 16px` | Radius: `9999px` | Font: `12.5px (Bold 750)` | Gap: `6px`
* **Compact Pill Button (`.cms-btn-sm`):**
  * Tinggi: `30px` | Padding: `0 12px` | Radius: `9999px` | Font: `11.5px (Bold 700)`
* **Standard Circle Icon Button (`.cms-circle-btn`):**
  * Ukuran: `32px × 32px` | Radius: `50%` | Aspect-ratio: `1 / 1`
* **Compact Circle Icon Button (`.cms-circle-btn-sm`):**
  * Ukuran: `28px × 28px` | Radius: `50%` | Aspect-ratio: `1 / 1`

---

## 3. Skala Modular Tipografi (Typography Scale)

| Peran Tipografi | Tag / Class | Font Size | Weight | Line Height | Letter Spacing | Margin Bottom |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | `.cms-display` | `24px` | `850` | `1.2` | `-0.03em` | `8px` |
| **Title XL** | `h1`, `.cms-title-xl` | `20px` | `850` | `1.25` | `-0.025em` | `6px` |
| **Title LG** | `h2`, `.cms-title-lg` | `17px` | `800` | `1.3` | `-0.015em` | `6px` |
| **Title MD** | `h3`, `.cms-title-md` | `15px` | `750` | `1.35` | `-0.01em` | `4px` |
| **Title SM** | `h4`, `.cms-title-sm` | `13.5px` | `700` | `1.4` | `0em` | `4px` |
| **Body Standard**| `p`, `.cms-body` | `13px` | `450` | `1.55` | `-0.005em` | `8px` *(0 jika flex)* |
| **Subtitle** | `.cms-subtitle` | `12px` | `550` | `1.4` | `0em` | `2px` |
| **Caption / Meta**| `small`, `.cms-caption`| `11.5px` | `600` | `1.45` | `0em` | `0px` |
| **Micro / Badges**| `.cms-badge`, `.cms-tag`| `10.5px` | `750` | `1.25` | `+0.03em` | `0px` |

---

## 4. Ritme Spacing & Margin (4px / 8px Grid Rhythm)

Semua jarak margin, padding, dan gap disusun berdasarkan kelipatan ritme 4px/8px:
* `--cms-space-3xs`: `2px`
* `--cms-space-2xs`: `4px`
* `--cms-space-xs`: `6px`
* `--cms-space-sm`: `8px`
* `--cms-space-md`: `12px`
* `--cms-space-lg`: `16px`
* `--cms-space-xl`: `20px`
* `--cms-space-2xl`: `24px`

### Aturan Card & Margin:
* **Card Header (`.cms-card-header`):** Selalu menggunakan `gap: 8px` dan `margin-bottom: 12px`.
* **Zero Rogue Margin:** Elemen anak pertama kartu memiliki `margin-top: 0 !important`, anak terakhir memiliki `margin-bottom: 0 !important`.
* **Section Canvas:** Jarak vertikal antar-section diatur seragam `16px`.

---

## 5. Surface & Color Architecture (Analogous System)

Sistem warna menerapkan palet matte berkelas tanpa glow berlebih (zero radioactivity):
* **Canvas Background (`--surface-canvas`):** `#0A0B0E` (Dark) / `#F3F4F8` (Light)
* **Panel Background (`--surface-panel`):** `#121318` (Dark) / `#FFFFFF` (Light)
* **Card Background (`--surface-card`):** `#181926` (Dark) / `#F8FAFC` (Light)
* **Elevated Surface (`--surface-elevated`):** `#20222B` (Dark) / `#FFFFFF` (Light)
* **Border Subtly (`--surface-border-subtle`):** `rgba(255, 255, 255, 0.08)` (Dark) / `rgba(0, 0, 0, 0.08)` (Light)
* **Border Medium (`--surface-border-medium`):** `rgba(255, 255, 255, 0.14)` (Dark) / `rgba(0, 0, 0, 0.14)` (Light)

---

## 6. Kaidah Micro-Copy & UX Interactions

1. **Pelabelan Ringkas (1–2 Kata):** Hindari tombol berkalimat panjang. Gunakan label fokus seperti `Traffic`, `Keamanan`, `Optimasi`, `Segarkan`, `Ekspor`, `Simpan`.
2. **Icon-Only Action:** Tombol aksi sekunder di toolbar wajib mengutamakan icon-only (`32px` atau `28px`) dengan tooltip `title` yang jelas untuk menghemat ruang visual.
3. **Internal Scrolling:** Halaman kerja terkunci pada viewport layar (`overflow: hidden`), dan konten di dalam kartu/tabel yang bergulir mandiri (`overflowY: auto`) dengan sticky header.
4. **Instant Tactile Spring:** Tombol dan kontrol interaktif menggunakan respon mikro `transform: scale(0.97)` saat ditekan (`:active`) untuk sensasi aplikasi native 120 FPS.
