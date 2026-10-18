# Architecture & Design Decisions — Free English Practice (FEP)

Dokumen ini mencatat keputusan teknis dan desain yang diambil untuk menjaga kesederhanaan dan kepatuhan terhadap `GDD.md`, `SPEC_ADDENDUM.md`, dan `PLAN.md`.

## 1. Kamera & Kontrol Pemain
- **Pilihan:** First-Person Perspective (FPP) dengan Three.js `PointerLockControls` / custom pointer lock wrapper.
- **Rasional:** Paling immersif untuk battle royale greybox dan interaksi dialog, serta mempermudah mekanik menembak hitscan pada War Action (crosshair di tengah layar).
- **Interaksi UI:** Menekan tombol `T` atau mengklik input box akan melepas pointer lock sementara agar pemain dapat mengetik pesan teks fallback dengan mudah tanpa terganggu pergerakan kamera.

## 2. Tata Letak Arena (6 Lokasi)
- **Ukuran Map:** Bidang lantai 200x200 unit dengan batas arena terlihat.
- **Lokasi Spawn:** 
  - Base 1 (Spawn Pemain & Teammates): Sisi Selatan (0, 0, 70).
  - Base 2 (AI Squad 2): Sisi Barat (-70, 0, 20).
  - Base 3 (AI Squad 3): Sisi Utara-Barat (-50, 0, -60).
  - Base 4 (AI Squad 4): Sisi Utara-Timur (50, 0, -60).
  - Base 5 (AI Squad 5): Sisi Timur (70, 0, 20).
  - War Action Point: Pusat arena (0, 0, 0) dengan tugu/pilar sentral penanda Safe Zone akhir.

## 3. Komunikasi & Fallback Logging
- **Deteksi Intent:** Rule-based matching kata kunci dan variasi kalimat umum untuk tiap peran NPC:
  - *Support:* Permintaan amunisi/medkit (`give me ammo`, `need ammunition`, `need bullets`, `help`).
  - *Scout:* Arah rotasi/musuh (`where is the enemy`, `which way to go`, `route to safe zone`, `scout area`).
  - *Assault:* Koordinasi tempur/readiness (`ready for battle`, `attack formation`, `status check`).
- **Target NPC:** Otomatis dipilih berdasarkan NPC terdekat yang sedang didekati pemain (jarak <= 6 unit) atau dipilih lewat dropdown/konteks aktif.
- **Array Log:** Tersimpan di `gameState.communicationLogs` dengan skema `{ timestamp, targetNpc, transcript, intent, taskScore, vocabScore, grammarScore, source }`.
- **Ekspor JSON:** Tombol di Result Screen men-download file JSON berisi riwayat interaksi pemain.

## 4. Sistem Scoring
- **Task Completion:** Skor 0 - 100 berdasarkan keberhasilan intent matching dengan objective aktif.
- **Vocabulary & Grammar (Stub):** Di-mock menggunakan fungsi heuristik sederhana dan diberi label tegas `(stub)` di Result Screen sesuai instruksi review.
- **Pemisahan Skor:** Peringkat pertempuran (#1 - #5) dan Skor Bahasa Inggris disimpan terpisah dan ditampilkan bersamaan di Result Screen tanpa saling memengaruhi.

## 5. War Action Combat & Player Shooting
- **Shooting Mekanik:** Klik kiri mouse menembakkan raycast hitscan dari tengah kamera.
- **Statistik & Squad Readiness:** Squad Readiness yang dikumpulkan dari Phase 1 & Phase 2 memberikan buff HP dan damage ke squad pemain di Phase 3.
- **AI Behavior:** FSM sederhana (Move to Center -> Target Nearest Enemy -> Attack with interval).

## 6. Model Karakter Hinaly (public/models/hinaly.glb) & Halaman Uji
- **Halaman Uji Mandiri:** Dibuat halaman `test-model.html` dan script `src/test-model.js` dengan konfigurasi multi-page di `vite.config.js`. Halaman ini menggunakan `GLTFLoader` dan `OrbitControls` untuk memuat dan menginspeksi model 3D tanpa mengubah atau mengganggu loop game utama.
- **Hasil Pemeriksaan Model `public/models/hinaly.glb`:**
  - **Daftar Animation Clip:** **0 clip** (tidak ada track animasi dalam file glTF/GLB). Model terdeteksi sebagai static mesh tunggal (`tripo_mesh_...`) hasil generator Tripo 2.0.
  - **Tinggi Model (Height):** **0.998 meter** (Bounding Box: $0.518\text{ m} \times 0.998\text{ m} \times 0.463\text{ m}$; posisi $Y_{min} = 0.000$, $Y_{max} = 0.998$).
  - **Jumlah Segitiga (Triangles):** **18.604 segitiga** (dari 55.812 indeks dan 23.027 vertex).
  - **Pemutaran Clip Pertama:** Karena file model tidak memiliki animation clip (`gltf.animations.length === 0`), `AnimationMixer` tidak memutar animasi dan status pemutaran menampilkan notifikasi bahwa model berstatus static mesh (0 clip).
- **Catatan & Rekomendasi Integrasi:**
  - Tinggi model dasar adalah $\approx 1.0\text{ m}$. Untuk disesuaikan dengan proporsi karakter game ($1.8\text{ m}$ eye level), model perlu dinaikkan skalanya sekitar $1.7\times - 1.8\times$.
  - Untuk animasi gerak (idle, walk, run, jump, shoot), model perlu di-rig dan diberi skeleton (misalnya via Mixamo / Blender) sebelum klip animasi dapat diputar.

