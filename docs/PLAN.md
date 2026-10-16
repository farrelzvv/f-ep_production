# Implementation Plan — Free English Practice (FEP) Greybox MVP

Dokumen perencanaan implementasi teknis FEP MVP berbasis Three.js + Vite sesuai `docs/GDD.md` dan `docs/SPEC_ADDENDUM.md`.

---

## 1. Struktur Folder

```text
fep-client/
├── docs/                     # GDD.md, SPEC_ADDENDUM.md, PLAN.md
├── public/                   # Asset statis publik
├── src/
│   ├── communication/        # Sistem komunikasi & evaluasi bahasa
│   │   ├── stt.js            # Web Speech API wrapper + fallback listener
│   │   ├── intent.js         # Rule-based phrase bank matcher
│   │   └── scoring.js        # Task completion & stub vocab/grammar scoring
│   ├── npc/                  # Entitas NPC & kecerdasan buatan
│   │   ├── teammate.js       # NPC Squad: Support, Scout, Assault
│   │   └── enemyAi.js        # State machine AI lawan (idle, move, combat)
│   ├── phases/               # Siklus match 3 fase
│   │   ├── phaseManager.js   # State machine orchestrator fase
│   │   ├── preparation.js    # Phase 1: spawn base & objective dialog
│   │   ├── rotation.js       # Phase 2: safe zone moving & navigation
│   │   └── warAction.js      # Phase 3: combat 5 squad di central point
│   ├── player/               # Karakter pemain
│   │   ├── controller.js     # Movement WASD, mouse look, raycaster interaksi
│   │   └── playerState.js    # Data Hinaly (HP, ammo, resource)
│   ├── scene/                # Pengaturan grafis 3D (Three.js)
│   │   ├── arena.js          # Greybox map (5 spawn base + 1 war point)
│   │   └── world.js          # Scene, Camera, Renderer, resize handler
│   ├── state/                # Manajemen status global
│   │   └── gameState.js      # In-memory store (readiness, match stats, scores)
│   ├── ui/                   # Antarmuka web (DOM overlay)
│   │   ├── hud.js            # HUD status, mic indicator, text input fallback
│   │   ├── feedbackPanel.js  # Transkrip suara & feedback intent/dialog
│   │   ├── matchSetup.js     # Mock matchmaking screen ("Searching... 5/5 Ready")
│   │   └── resultScreen.js   # Peringkat match vs skor bahasa Inggris terpisah
│   ├── main.js               # Bootstrap aplikasi & game loop
│   └── style.css             # Styling HUD dan UI screen
├── index.html
└── package.json
```

---

## 2. Milestones M1 – M5 (Independently Runnable)

| Milestone | Fokus & Fitur Utama | Cara Verifikasi / Runnable Check |
|---|---|---|
| **M1: 3D Greybox Arena & Player Controller** | Inisialisasi Three.js, map 6 lokasi (5 base + 1 war point), primitif box/capsule, pergerakan pemain (WASD + mouse look), spawn 3 teammate primitif di base. | Buka browser: pemain bisa bergerak mengelilingi arena greybox, melihat 5 base, dan mendekati 3 NPC teammate di base awal. |
| **M2: Communication System & Fallback UI** | Integrasi Web Speech API, UI status mic (Idle/Listening/Result), input box teks (fallback), rule-based intent matching, stub scoring. | Buka browser: bicara lewat mic atau ketik teks (mis. *"give me ammo"*); UI menampilkan transkrip, intent terdeteksi, dan nilai evaluasi stub. |
| **M3: Phase 1 (Preparation) Gameplay Loop** | Mock Match Setup Screen ("5/5 Ready"), spawn squad pemain, objective dialog 3 NPC (Support: ammo, Scout: arah, Assault: taktik), Squad Readiness counter. | Jalankan match: masuk via Match Setup, selesaikan objektif berbicara ke 3 teammate; Squad Readiness bertambah jika berhasil. |
| **M4: Phase 2 (Rotation) & Zone Mechanics** | Safe zone mengecil dan bergerak menuju War Action Point, time pressure, dialog komunikasi Scout untuk rute optimal vs penalti detour. | Pemain bergerak mengikuti safe zone; bertanya arah ke Scout memberi waypoint optimal; terkena penalti waktu/damage jika keluar zona. |
| **M5: Phase 3 (War Action), Combat & Result Screen** | 5 squad (20 karakter) berkumpul di War Action Point, state machine combat sederhana (dipengaruhi Squad Readiness), Result Screen final. | Pertarungan otomatis/semi-aktif berjalan; squad terakhir bertahan menang; Result Screen muncul menampilkan Peringkat (#1-#5) dan Skor Inggris terpisah. |

---

## 3. Bagian yang Di-Mock

1. **Aset Visual 3D**: Menggunakan primitif Three.js murni (`BoxGeometry`, `CapsuleGeometry`, `CylinderGeometry`) dengan flat color material; tanpa model 3D `.gltf`/`.fbx` atau texture eksternal.
2. **STT & Fallback Input**: Web Speech API dilengkapi text input box di HUD untuk pengujian tanpa mikrofon fisik atau di browser non-Chromium.
3. **Intent Recognition**: Rule-based matching berbasis kamus kata kunci (`phrase bank`), bukan model machine learning / LLM API.
4. **Scoring Vocabulary & Grammar**: Fungsi stub dengan nilai default/formula sederhana bertanda `// MOCK: skor stub` dan `// TODO: integrasi modul evaluasi`.
5. **Matchmaking & Networking**: Tampilan visual matchmaking murni simulasi lokal (mock timer & status pemain) tanpa backend atau multiplayer network.
6. **Backend & Database**: Seluruh state pemain, skor, dan riwayat match disimpan murni di memori runtime JavaScript (`in-memory state`).
7. **Combat Mechanics**: Pertarungan War Action disederhanakan menggunakan Finite State Machine probabilitas berbobot Squad Readiness, bukan sistem balistik kompleks.

---

## 4. Risiko Utama & Mitigasi

| Risiko Utama | Dampak | Strategi Mitigasi |
|---|---|---|
| **Kompatibilitas & Izin Mic Web Speech API** | Fitur STT gagal di browser non-Chrome (Firefox/Safari) atau saat mic diblokir. | Sediakan input teks fallback permanen di HUD; alur komunikasi tetap 100% berjalan via teks. |
| **False Negative pada Intent Matching** | Ucapan pemain yang maknanya benar gagal dikenali karena variasi kata/typo STT. | Gunakan daftar sinonim leksikal fleksibel per intent dan tampilkan feedback real-time agar pemain tahu kata yang diharapkan. |
| **Penurunan FPS dengan 20 Karakter 3D** | Animasi dan logika 20 entitas (1 pemain + 19 NPC) menurunkan performa browser. | Gunakan geometri primitif berskala rendah, instanced mesh jika relevan, dan throttling tick AI (update tiap 100-200ms, bukan tiap frame). |
| **Desinkronisasi State Transisi Fase** | Timer habis saat dialog berlangsung atau kalkulasi readiness terlambat dioper ke combat. | `phaseManager` menggunakan state lock berbasis event; transisi mengunci input dan melakukan commit snapshot state sebelum fase berikutnya dimulai. |
| **Pemisahan Skor Game vs Skor Edukasi** | Nilai combat memengaruhi skor bahasa atau sebaliknya, melanggar spesifikasi. | Objek `gameState` memisahkan secara ketat `matchRank` dan `englishScore` (Task Completion, Vocab, Grammar) sampai dirender di `resultScreen`. |
