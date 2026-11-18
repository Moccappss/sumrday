# Folder Penyimpanan Model 3D Lokal (.glb)

Folder ini digunakan untuk menyimpan file model 3D (seperti hasil export dari **SketchUp** atau **Blender**).

### Keunggulan Menyimpan di Sini:
1. **0 Biaya & 0 Token**: Tidak disimpan di Firebase Storage dan tidak menggunakan token AI.
2. **Offline-friendly**: Langsung disajikan oleh server lokal browser tanpa bergantung pada API pihak ketiga.
3. **Cepat & Ringan**: File di-load dengan latensi minimal.

### Cara Menggunakan:
1. Export model 3D dari SketchUp ke format `.glb` (misal: `villa-modern.glb`).
2. Masukkan file tersebut ke dalam folder ini (`public/models/villa-modern.glb`).
3. Pada form Admin Proyek atau konfigurasi portofolio, isi alamat model dengan:
   `/models/villa-modern.glb`
