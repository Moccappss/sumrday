# PANDUAN PENTING UNTUK AI (WAJIB DIBACA SEBELUM MENULIS KODE)

Kamu sedang membuat aplikasi/ekstensi kustom untuk **Agency OS**. 
Template ini sudah berstatus **PAKET LENGKAP** dengan struktur file modular.
Sistem secara otomatis telah memiliki pembagian file berikut:
- `index.jsx` (Wadah utama navigasi - JANGAN DIUBAH)
- `components/ClientView.jsx` (Tampilan untuk klien/publik)
- `components/AdminView.jsx` (Tampilan untuk pengelola/CMS)
- `styles.css` (Tempat menaruh CSS kustom aplikasi)

## ATURAN KODING & DESAIN UI/UX:
1. **FOKUS PADA KOMPONEN**: Kamu **HANYA** perlu men-develop dan mengisi kode pada file `components/ClientView.jsx` dan `components/AdminView.jsx`, serta gaya di `styles.css` jika dibutuhkan. JANGAN ubah `index.jsx`.
2. **Desain Terpadu (Satu Tema)**: Gunakan class bawaan sistem dan variabel warna agar menyatu dengan baik.
   - Background utama panel: `var(--cms-bg)` atau `var(--cms-switcher-bg)`
   - Kotak/Card elemen: Pakai `className="cms-card premium-glass"`
   - Warna aksen/utama tombol: `var(--cms-accent)`
   - Warna Teks: `var(--cms-text)` dan `var(--cms-text-muted)`
   - Border efek glass: `1px solid var(--glass-border)`
3. **Bentuk "Pill Rounded"**: Jangan buat UI yang kaku kotak! 
   - Sudut untuk kotak/card: `borderRadius: 30` (atau 24).
   - Sudut untuk tombol/input: `borderRadius: 99` (full pill) atau `borderRadius: 30`.
4. **Responsif Sepenuhnya**: Layout harus menyesuaikan diri (fleksibel). Gunakan `display: flex`, `flexWrap: wrap`, atau CSS Grid.
5. **Gunakan Ikon Lucide**: Semua ikon wajib diambil dari `lucide-react` (Misalnya `<Plus />`, `<Settings />`, dll).
6. **Fungsionalitas State (Hooks)**: Buat variabel data simulasi memakai `useState` di dalam komponen Admin/Client. Berikan simulasi CRUD sederhana jika aplikasi menuntut pengelolaan data.

**TUGASMU:**
Bangun fitur yang diminta oleh USER. Pahami struktur folder yang sudah ada, lalu tuliskan kode pengembangan HANYA untuk file `components/ClientView.jsx`, `components/AdminView.jsx`, dan `styles.css`. Jangan merusak kerangka utama yang sudah tertata dengan rapi!
