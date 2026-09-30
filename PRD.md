# PRD — Peminjaman Ruang & Aset Kampus

**Nama aplikasi:** Peminjaman Ruang & Aset Kampus
**Deskripsi:** Sistem peminjaman ruang dan aset kampus dengan approval berjenjang (2 level), anti-bentrok jadwal ruang, status aset real-time, dan pencatatan perawatan + riwayat kondisi aset.
**Stack:** Next.js 14 + TypeScript + Prisma 5.22 + SQLite + Tailwind CSS
**Bahasa UI:** Indonesia
**Repo GitHub:** BenyRonald77/peminjaman-ruang-aset-kampus

## F0 — Setup: skema data, seed, layout, dashboard

Model data (Prisma):

- **Ruang** — `id`, `nama` (unik), `gedung`, `kapasitas` (int), `fasilitas` (teks), `created_at` (ISO TEXT)
- **Aset** — `id`, `nama`, `kode_unik` (unik), `kategori` (mis. Proyektor, Laptop, Sound System), `kondisi`: `baik` | `rusak_ringan` | `rusak_berat`, `status`: `tersedia` | `dipinjam` | `dalam_perawatan`, `created_at`
- **BookingRuang** — `id`, `ruang_id` (FK), `peminjam_nama`, `keperluan`, `tanggal` (TEXT YYYY-MM-DD), `jam_mulai` (TEXT HH:MM), `jam_selesai` (TEXT HH:MM), `status`: `diajukan` | `disetujui_lv1` | `disetujui` | `ditolak`, `created_at`
- **BookingAset** — `id`, `aset_id` (FK), `peminjam_nama`, `keperluan`, `tanggal_pinjam` (TEXT YYYY-MM-DD), `tanggal_kembali` (TEXT YYYY-MM-DD), `status`: `diajukan` | `disetujui_lv1` | `disetujui` | `ditolak` | `dikembalikan`, `created_at`
- **Persetujuan** — `id`, `booking_type`: `ruang` | `aset`, `booking_id` (int, FK logis), `level`: 1 | 2, `keputusan`: `setuju` | `tolak`, `catatan`, `diputus_pada` (ISO TEXT)
- **PerawatanAset** — `id`, `aset_id` (FK), `tanggal` (TEXT YYYY-MM-DD), `jenis` (mis. Servis rutin, Perbaikan, Kalibrasi), `keterangan`, `biaya` (int), `selesai` (bool, default false), `created_at`
- **RiwayatKondisi** — `id`, `aset_id` (FK), `tanggal` (TEXT YYYY-MM-DD), `kondisi`: `baik` | `rusak_ringan` | `rusak_berat`, `catatan`, `created_at`

Seed (hanya jalan jika tabel kosong):
- 3 ruang: Aula Utama (Gedung A, 200 orang, fasilitas Proyektor + Sound System), Ruang Rapat 1 (Gedung B, 30 orang), Lab Komputer (Gedung C, 40 orang)
- 5 aset: Proyektor Epson (PRJ-001), Laptop Dell (LPT-001), Sound System Yamaha (SND-001), Microphone Wireless (MIC-001), Whiteboard Mobile (WBD-001)
- Contoh booking: 1 booking ruang diajukan, 1 booking ruang disetujui (agar anti-bentrok bisa diuji), 1 booking aset disetujui

Dashboard (`/`): ringkasan jumlah ruang, aset per status, booking menunggu persetujuan, perawatan berjalan.

## F1 — Master data: CRUD ruang & aset

Halaman `/ruang`: tabel + form tambah, edit, hapus.
Halaman `/aset`: tabel + form tambah, edit, hapus.
API:
- `GET/POST /api/ruang`, `GET/PATCH/DELETE /api/ruang/[id]`
- `GET/POST /api/aset`, `GET/PATCH/DELETE /api/aset/[id]`
Aturan: hapus ruang/aset ditolak (409) jika masih punya booking aktif (status selain `ditolak`/`dikembalikan`) — mencegah data yatim.

## F2 — Booking ruang + approval berjenjang

Halaman `/booking` (tab Ruang / Aset): form booking ruang + daftar booking + tombol setuju/tolak per level.
API:
- `POST /api/booking-ruang` — body: `ruang_id`, `peminjam_nama`, `keperluan`, `tanggal`, `jam_mulai`, `jam_selesai` → status awal `diajukan`. Validasi:
  - field wajib → 400; ruang tidak ada → 404; `jam_mulai < jam_selesai` → 400; format tanggal/jam → 400
  - **Overlap KERAS → 409**: bentrok dengan booking ruang lain yang statusnya `diajukan` / `disetujui_lv1` / `disetujui` pada ruang + tanggal yang sama dengan rentang jam beririsan (`jam_mulai < existing.jam_selesai && jam_selesai > existing.jam_mulai`). Booking `ditolak` diabaikan.
- `PATCH /api/booking-ruang/[id]/approve` — body: `level` (1|2), `keputusan` (`setuju`|`tolak`), `catatan`:
  - level 1 & status `diajukan`: setuju → `disetujui_lv1`, tolak → `ditolak`
  - level 2 & status `disetujui_lv1`: setuju → `disetujui`, tolak → `ditolak`
  - level tidak sesuai status → 409 (urutan persetujuan tidak boleh dilompat)
  - booking `ditolak`/`disetujui` final → 409 (tidak bisa diubah)
  - setiap keputusan tercatat di `Persetujuan` (booking_type=`ruang`, level, keputusan, catatan, diputus_pada)
- `GET /api/booking-ruang` — filter opsional `?date=YYYY-MM-DD` (untuk kalender) dan `?status=`

## F3 — Booking aset + pengembalian

API:
- `POST /api/booking-aset` — body: `aset_id`, `peminjam_nama`, `keperluan`, `tanggal_pinjam`, `tanggal_kembali` → status awal `diajukan`. Validasi:
  - aset tidak ada → 404; tanggal kembali ≥ tanggal pinjam → 400
  - **Aset tidak tersedia → 409**: aset dengan `status` ≠ `tersedia` (sedang `dipinjam` atau `dalam_perawatan`) untuk rentang tanggal yang beririsan dengan booking aset yang sudah `diajukan`/`disetujui_lv1`/`disetujui` → 409
- `PATCH /api/booking-aset/[id]/approve` — alur sama seperti booking ruang. Saat **level 2 disetujui** → `aset.status = dipinjam`. Tolak di level mana pun → `ditolak` (aset tetap tersedia).
- `POST /api/booking-aset/[id]/kembalikan` — body: `kondisi_akhir` (`baik`|`rusak_ringan`|`rusak_berat`), `catatan`. Hanya untuk booking status `disetujui`. → status `dikembalikan`, `aset.status = tersedia`, `aset.kondisi = kondisi_akhir`, catat ke `RiwayatKondisi`. Booking dengan status lain → 409.
- `GET /api/booking-aset` — filter opsional `?status=`, `?date=YYYY-MM-DD`

## F4 — Perawatan aset & riwayat kondisi

Halaman `/aset/[id]`: detail aset + riwayat kondisi + riwayat perawatan + tombol mulai/selesaikan perawatan.
API:
- `POST /api/perawatan` — body: `aset_id`, `tanggal`, `jenis`, `keterangan`, `biaya` → catat perawatan, `aset.status = dalam_perawatan`. Aset yang sedang dipinjam → 409 (tidak bisa dirawat).
- `PATCH /api/perawatan/[id]` — body: `selesai: true` → `selesai = true`, `aset.status = tersedia` (kecuali aset sedang dipinjam booking aktif → tetap `dipinjam`).
- `GET /api/perawatan?aset_id=` — daftar perawatan.
- `POST /api/aset/[id]/kondisi` — body: `kondisi`, `catatan` → ubah `aset.kondisi`, catat ke `RiwayatKondisi`.
- Setiap perubahan kondisi (via perawatan selesai, pengembalian, atau endpoint kondisi) tercatat di `RiwayatKondisi`.

## F5 — Dashboard & kalender/jadwal

Halaman:
- `/` (dashboard): kartu statistik (total ruang, aset tersedia/dipinjam/perawatan, booking ruang menunggu, booking aset menunggu), daftar booking terbaru, aset dalam perawatan.
- `/jadwal`: kalender — pilih tanggal, tampilkan grid **tanggal × ruang** (kolom per ruang, baris per jam) dengan blok booking berwarna sesuai status: kuning = diajukan, biru = disetujui_lv1, hijau = disetujui, merah = ditolak.
- `/aset`: kartu/daftar semua aset dengan badge status; klik → `/aset/[id]`.
API:
- `GET /api/booking-ruang?date=` — booking ruang pada tanggal tertentu (untuk kalender)
- `GET /api/booking-aset?status=` — booking aset per status

## Aturan umum

- Tanggal TEXT `YYYY-MM-DD`, jam TEXT `HH:MM`, timestamp ISO TEXT.
- Error: validasi → 400, tidak ketemu → 404, konflik bisnis → 409.
- UI berbahasa Indonesia, tanpa atribusi AI.
