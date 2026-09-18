# 🚀 Panduan Deploy Agenze ke Tempat / Klien Kedua

Dokumen ini adalah panduan langkah-demi-langkah jika sewaktu-waktu Anda ingin mendeploy website ini ke **tempat kedua (domain atau klien baru)** dengan database, penyimpanan gambar, dan token yang **terpisah 100%**.

---

## 📋 Ringkasan Komponen yang Dipisahkan

| No | Layanan | Fungsi | Di Mana Mengaturnya |
|---|---|---|---|
| 1 | **Firebase Firestore** | Database utama (artikel, portofolio, pesan, setting) | [Firebase Console](https://console.firebase.google.com/) |
| 2 | **Cloudinary** | Penyimpanan gambar & media | [Cloudinary Console](https://cloudinary.com/console) |
| 3 | **Google Sheets & Script** | Sinkronisasi spreadsheet & formulir | [Google Sheets](https://docs.google.com/spreadsheets/) |
| 4 | **Gemini AI** | Pembuat konten AI | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| 5 | **Hosting** | Tempat website aktif di internet | Firebase Hosting / Vercel / Netlify |

---

## 🛠️ Langkah 1: Buat Database Firebase Baru (Firestore)

1. Masuk ke **[Firebase Console](https://console.firebase.google.com/)**.
2. Klik **Add project** (Tambah project) -> Beri nama project (contoh: `agenze-klien-dua`).
3. Matikan Google Analytics (opsional agar cepat) -> Klik **Create project**.
4. Di menu kiri, buka **Build > Firestore Database**:
   - Klik **Create database**.
   - Pilih Region: `asia-southeast2` (Jakarta) atau lokasi terdekat.
   - Pilih opsi **Start in test mode** -> Klik **Enable**.
5. Di menu kiri atas, klik ikon ⚙️ **Project settings**:
   - Scroll ke bawah ke bagian **Your apps** -> Klik ikon Web (`</>`).
   - Beri nama Web App -> Centang *Also set up Firebase Hosting*.
   - Salin isi `firebaseConfig`:
     - `apiKey` -> `VITE_FIREBASE_API_KEY`
     - `authDomain` -> `VITE_FIREBASE_AUTH_DOMAIN`
     - `projectId` -> `VITE_FIREBASE_PROJECT_ID`
     - `storageBucket` -> `VITE_FIREBASE_STORAGE_BUCKET`
     - `messagingSenderId` -> `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `appId` -> `VITE_FIREBASE_APP_ID`
     - `measurementId` -> `VITE_FIREBASE_MEASUREMENT_ID`

---

## ☁️ Langkah 2: Siapkan Cloudinary (Penyimpanan Media)

*Anda bisa memakai akun Cloudinary yang sama ATAU daftar akun baru gratis.*

1. Masuk ke **[Cloudinary Console](https://cloudinary.com/console)**.
2. Di **Dashboard**, salin nilai **Cloud Name** -> masukkan ke `VITE_CLOUDINARY_NAME`.
3. Buat **Upload Preset Unsigned**:
   - Klik ikon ⚙️ **Settings** (kiri bawah).
   - Pilih tab **Upload** -> scroll ke bawah ke bagian **Upload presets**.
   - Klik **Add upload preset**.
   - Pada kolom **Signing Mode**, ganti dari `Signed` menjadi **`Unsigned`** *(Wajib!)*.
   - Beri nama (misal: `klien2_preset` atau biarkan `ml_default`).
   - Klik **Save** -> masukkan namanya ke `VITE_CLOUDINARY_PRESET`.

---

## 📊 Langkah 3: Siapkan Google Sheets & Apps Script Baru

1. Buka **Google Sheets** dan buat spreadsheet baru (atau gunakan opsi *Make a copy* dari spreadsheet lama Anda).
2. Lihat URL di browser:
   `https://docs.google.com/spreadsheets/d/`**`KODE_DI_SINI`**`/edit`
   Salin kode tersebut ke `VITE_GOOGLE_SHEET_ID`.
3. Di spreadsheet tersebut, klik menu **Extensions > Apps Script**:
   - Hapus tulisan kode default.
   - Buka file [`google_apps_script.js`](./google_apps_script.js) dari folder project ini, salin **seluruh isinya**, lalu tempel ke editor Apps Script.
   - Klik ikon **Save** (Disket).
   - Klik tombol biru **Deploy** (kanan atas) -> **New deployment**.
   - Pilih tipe: **Web app**.
   - Execute as: **Me**.
   - Who has access: **Anyone** *(Wajib agar website bisa mengirim data tanpa login)*.
   - Klik **Deploy** -> Berikan izin otorisasi Google -> Salin URL yang berakhiran `/exec`.
   - Masukkan ke `VITE_GOOGLE_APPS_SCRIPT_URL`.

---

## 🤖 Langkah 4: Ambil API Key Gemini AI Baru

1. Kunjungi **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
2. Klik tombol **Create API Key**.
3. Salin kunci API yang dihasilkan -> masukkan ke `VITE_GEMINI_API_KEY`.

---

## 🚀 Langkah 5: Cara Deploy

Ada 2 cara paling populer yang bisa Anda pilih:

### Pilihan A: Deploy ke Vercel / Netlify (Paling Mudah & Rekomendasi)
1. Upload/Push folder project ini ke repository GitHub Anda.
2. Buka **Vercel** atau **Netlify**, lalu klik **Add New Project** dari repository tersebut.
3. Di bagian **Environment Variables**, masukkan semua variabel dari template [`.env.example`](./.env.example) dengan nilai-nilai baru yang sudah Anda dapatkan di Langkah 1-4.
4. Klik **Deploy**! Website langsung aktif dengan alamat dan database baru.

### Pilihan B: Deploy ke Firebase Hosting Tempat ke-2
1. Di terminal komputer Anda, login ke Firebase:
   ```bash
   npx firebase login
   ```
2. Tambahkan alias project kedua:
   ```bash
   npx firebase use --add
   ```
   *(Pilih project Firebase kedua yang Anda buat di Langkah 1, beri nama alias misalnya `tempat2`)*.
3. Ganti isi file `.env` dengan token tempat kedua.
4. Jalankan perintah deploy:
   ```bash
   npm run build
   npx firebase deploy --only hosting -P tempat2
   ```

---

## ✅ Langkah 6: Verifikasi Hasil

Setelah website kedua online:
1. Buka URL website tersebut lalu login ke menu admin `/admin`.
2. Buka tab **Cloud & Sync**:
   - Pastikan indikator **Firebase**, **Cloudinary**, **Apps Script**, dan **Google Sheets** berstatus **● TERHUBUNG / SIAP** (warna hijau).
3. Coba upload 1 foto dan buat 1 artikel uji coba untuk memastikan data masuk ke database baru Anda.
