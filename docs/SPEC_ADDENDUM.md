# SPEC ADDENDUM — menang atas GDD.md jika ada bentrok

## Koreksi terhadap GDD
- NPC squad pemain: **Support, Scout, Assault**. Abaikan penyebutan Sniper/Rusher/Ruser.
- Protagonis: **Hinaly**, anggota baru squad yang takut berbicara bahasa Inggris dan
  ingin membawa squad-nya menjadi yang terakhir bertahan.
  Abaikan latar "bingung menentukan arah hidup", abaikan "level berjenjang" dan
  "Kota Saranjana" (bagian 10 GDD tidak dipakai).
- Dunia: **FEP Arena**, arena simulasi survival global. Bahasa Inggris adalah bahasa
  komunikasi standar. NPC hanya merespons permintaan yang maksudnya jelas.
- Skor Inggris (task completion, vocabulary, grammar) dihitung **terpisah** dari peringkat
  match. Result screen menampilkan KEDUANYA (mis. "Peringkat #1, skor Inggris 45/100").
  Skor Inggris tidak boleh dipengaruhi menang/kalah combat.
- Platform: browser desktop, single-player (tidak ada multiplayer nyata).

## Batasan versi greybox (MVP awal)
- Semua karakter dan objek memakai primitif Three.js (capsule, box). Tanpa aset 3D eksternal.
- Speech-to-text: Web Speech API di browser, dengan **input teks sebagai fallback**
  (kotak ketik) agar bisa dites tanpa mic.
- Intent: rule-based dari phrase bank (daftar frasa per intent), bukan model AI.
- Skor vocabulary dan grammar: fungsi stub dengan komentar `TODO` (akan diganti nanti).
- Tanpa backend, tanpa database. Skor disimpan di memori saja.
- UI dan dialog dalam game memakai bahasa Inggris. Teks menu boleh bahasa Inggris juga.

## Konvensi kode
- Vite + Three.js (ES modules), JavaScript biasa.
- Pisahkan modul: `scene`, `player`, `npc`, `phases`, `communication` (stt, intent, scoring),
  `ui`, `state`.
- Tandai setiap bagian mock dengan komentar `// MOCK:` atau `// TODO:`.
- Jangan install library selain `three` kecuali benar-benar perlu; sebutkan alasannya.
- Commit per milestone dengan pesan singkat.
