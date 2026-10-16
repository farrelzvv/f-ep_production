# Game Design Document — Free English Practice (FEP)

> Catatan untuk agen: jika isi file ini bertentangan dengan `SPEC_ADDENDUM.md`,
> maka `SPEC_ADDENDUM.md` yang menang.

## 1. Visi, Scope, dan Tujuan

### 1.1 Visi
"Free English Practice" adalah game edukasi 3D berbasis web yang memakai struktur
permainan bergaya battle royale dan squad survival sebagai konteks utama untuk melatih
komunikasi bahasa Inggris. Fokus desain: game, communication, dan English learning.
Bahasa Inggris menjadi bagian dari gameplay yang dipakai pemain untuk menyelesaikan objektif.

Core fantasy: pemain adalah anggota squad yang harus bekerja sama dengan tim,
berkomunikasi dalam bahasa Inggris, dan mengambil keputusan untuk bertahan sampai
menghadapi squad lain di pertempuran akhir.

### 1.2 Scope MVP
- 3D environment berbasis web menggunakan Three.js.
- Satu map utama dengan 6 lokasi: 5 titik spawn awal dan 1 titik War Action di akhir.
- Struktur match dalam tiga fase: Preparation → Rotation → War Action.
- Lima squad per match, masing-masing 4 anggota. Squad pemain = 1 pemain manusia + 3 NPC
  teammate; 4 squad lawan sepenuhnya dikendalikan AI. Total: 1 manusia + 19 NPC.
- Tiga NPC teammate di squad pemain: Support, Scout, Assault. Masing-masing punya fungsi
  komunikasi yang berbeda.
- Sistem komunikasi berbasis microphone dan speech-to-text.
- Intent-based evaluation untuk mengenali maksud komunikasi, bukan exact string matching.
- Squad Readiness yang dibentuk dari hasil Preparation dan Rotation, terutama lewat
  resource, informasi, kondisi squad, dan keuntungan posisi.
- Simple combat pada War Action dengan AI lawan berbasis state machine.
- Sistem skor, progression dasar, dan result screen.
- Match Setup Screen yang menampilkan pengalaman seperti matchmaking, tetapi match
  sebenarnya single-player simulation.

### 1.3 Tujuan Proyek
- Gameplay battle royale yang seru sambil berkomunikasi dalam bahasa Inggris.
- Bahasa Inggris dipakai langsung saat bermain (minta bantuan, tanya lokasi musuh,
  minta amunisi, memberi arahan), bukan sekadar soal atau kuis.
- Pemain terbiasa berkomunikasi dalam situasi sederhana terkait permainan; kalimat tidak
  harus sempurna selama maksudnya bisa dipahami.
- Mendukung English On Mic sebagai media latihan, serta mini competition dan leaderboard.

## 3. Key Requirements

### 3.1 Design
- Gameplay battle royale harus terasa dominan dibanding nilai edukasinya.
- Setiap match mengikuti 3 fase: Preparation, Rotation, War Action.
- Setiap NPC punya objective komunikasi sesuai perannya.
- Match Setup Screen mempertahankan elemen visual seperti "Searching for Match..." dan
  "5/5 Squads Ready", tanpa multiplayer realtime.
- Kemenangan tidak ditentukan oleh English score semata, tetapi kombinasi komunikasi,
  keputusan, resource, dan combat.

### 3.2 Technology
- Three.js untuk rendering 3D (scene, camera, lighting, objects, animation, interaction).
- HTML, CSS, JavaScript.
- Speech-to-text untuk menangkap ucapan pemain lewat microphone.
- Intent-based evaluation untuk mengidentifikasi maksud komunikasi.
- Backend dan database untuk data pemain, skor, progress, dan leaderboard (di luar MVP greybox).

## 4. Concept Summary
- Title: Free English Practice
- Gameplay hook: pemain adalah anggota squad (1 manusia + 3 NPC) yang bersaing melawan
  4 squad AI. Untuk memperkuat kondisi squad sebelum War Action, pemain harus
  berkomunikasi dalam bahasa Inggris dengan teammate lewat objective seperti meminta
  amunisi, menanyakan arah, memberi informasi, dan mengoordinasikan pergerakan.
  Bahasa Inggris adalah input gameplay yang menghasilkan konsekuensi di dalam game.
- Genre: Educational Game; pengaruh gameplay: Battle Royale, Squad Survival, Communication Game.
- Theme: squad survival, tactical communication, English speaking.
- Platform: web browser, target awal laptop/desktop dan browser modern.

## 5. Target Audience
Remaja sampai dewasa (16-25 tahun), terutama audiens English On Mic yang familiar dengan
game battle royale Free Fire, dan pemain yang termotivasi belajar bahasa Inggris.

## 6. Game Setting
Arena simulasi/survival dengan 6 lokasi. Lima lokasi dipakai sebagai titik spawn awal
masing-masing squad (agar pertarungan tidak terlalu dini), satu lokasi menjadi War Action
Point tempat semua squad akhirnya bertemu. Kompleksitas komunikasi meningkat dari basic
communication, asking/requesting, reporting, coordination, sampai situational/free
communication.

## 7. Gameplay System

### Tiga fase utama
**Phase 1 — Preparation.** Squad pemain spawn di salah satu dari lima lokasi awal dan
berinteraksi dengan tiga NPC teammate, masing-masing membawa objective komunikasi
sesuai perannya. Menyelesaikan objective memberi resource atau keuntungan (ammo,
informasi, kondisi squad, peningkatan readiness). Gagal atau melewatkan objective
mengurangi resource, membuang waktu, atau menurunkan readiness. Output fase ini adalah
kondisi awal squad.

**Phase 2 — Rotation.** Zona bergerak/mengecil menuju area akhir. Pemain berkomunikasi
dengan Scout untuk mendapat informasi arah tujuan, memahami respons NPC, dan menentukan
rute. Komunikasi berhasil menghasilkan rute lebih optimal atau keuntungan posisi;
gagal membuat rute lebih jauh, waktu hilang, atau posisi kurang menguntungkan.

**Phase 3 — War Action.** Lima squad bergerak menuju War Action Point, squad pemain
membawa konsekuensi dari Preparation dan Rotation. Readiness lebih baik memberi lebih
banyak resource, kondisi squad lebih baik, informasi, atau keuntungan posisi. Combat
memakai sistem sederhana sesuai scope MVP. Squad pemain menang jika menjadi squad
terakhir yang bertahan.

### Rules and Mechanics
- Player movement: berjalan, berlari, melihat sekitar, mendekati NPC, berpindah area,
  berinteraksi dengan objek.
- Interaksi: teammate, supply box, mission point, safe-zone marker, information point.
- Alur komunikasi: situasi → pemain memahami situasi → pemain berbicara → speech-to-text
  → intent/evaluasi → respons sistem → hasil dan feedback.
- Evaluasi pendidikan: Task Completion, Vocabulary, Grammar. Bobot akhir perlu divalidasi
  lewat pengujian. Pada MVP, task completion adalah aspek utama. Pronunciation bukan
  penentu skor MVP.
- Gameplay consequence: hasil komunikasi berdampak pada resource dan Squad Readiness
  (misal teammate memberi ammo atau info rute lebih baik), bukan hanya nilai.
- Failure state: bukan selalu game over; bisa berupa reduced score, lost time,
  reduced resource, atau rute alternatif yang lebih sulit.
- Win condition: menjadi squad terakhir yang bertahan di War Action. Objective di
  Preparation dan Rotation bukan syarat kemenangan langsung, tetapi memengaruhi resource,
  kondisi, informasi, dan posisi saat War Action dimulai.

### Gameplay modes
Main Mission: Preparation → Rotation → War Action.

### Reward system / achievements
Skor berasal dari objective completion, communication performance, response speed, dan
mission completion. Achievement: First Call, Team Player, Clear Communication,
Squad Leader, Survivor.

### Game options
Main Menu (Play, Leaderboard, Settings, Tutorial, Profile); Audio (volume, on/off);
Graphics (rendah/sedang/tinggi); Hints (petunjuk arah atau contoh kalimat saat pemain
kesulitan); Controls (sensitivitas mouse/keyboard, tombol microphone); Save.

## 8. Art dan Audio

### Visual direction
Stylized 3D low-poly: menjaga performa browser, mudah diproduksi tim kecil, tetap
terasa seperti game survival modern. Tidak memakai aset/logo/karakter resmi game tertentu.

### Environment
- Spawn/Base: titik awal, briefing, objective awal.
- Residential Area: skenario reporting enemy dan location.
- Supply Area: skenario requesting ammo/resource.
- Open Area: movement, coordination, situasi berisiko.
- Safe Zone: area tujuan pada Rotation dan sumber time pressure.
- War Action Point: lokasi akhir tempat kelima squad bertemu.

### Audio direction
Background music ringan dan dinamis, intensitas naik menjelang War Action. Sound effects:
footsteps, interaction, item pickup, warning zone, mission success/failure, microphone
activation, feedback komunikasi. NPC voice line sederhana untuk listening dan konteks.

## 9. User Interface

### In-game
- HUD: status pemain, objective aktif, timer, safe-zone indicator, squad status, score,
  microphone status.
- Mission Panel: objective dan konteks komunikasi aktif.
- Microphone Indicator: Idle, Listening, Processing, Result.
- Feedback Panel: transkrip ucapan, intent terdeteksi, feedback vocabulary/grammar, score.

### Out of game
- Main Menu: Play, Leaderboard, Settings, Tutorial, Profile.
- Tutorial: video tutorial gameplay.
- Result Screen: total score, mission completion, communication performance, waktu,
  achievement, opsi retry/next.

## 11. Technical Design
Three.js untuk rendering 3D; HTML, CSS, JavaScript untuk web; backend framework dan
database untuk manajemen data.
