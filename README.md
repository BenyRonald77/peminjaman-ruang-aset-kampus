# Peminjaman Ruang & Aset Kampus

Sistem peminjaman ruang dan aset kampus dengan approval berjenjang (2 level),
validasi anti-bentrok jadwal ruang, status aset real-time, serta pencatatan
perawatan dan riwayat kondisi aset.

Stack: Next.js 14 + TypeScript + Prisma 5.22 + SQLite + Tailwind CSS.

## Cara Menjalankan

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

## Halaman

- `/` — Dashboard: statistik ruang, aset per status, booking menunggu persetujuan, perawatan berjalan
- `/ruang` — Master data ruang (tambah/edit/hapus)
- `/aset` — Master data aset (tambah/edit/hapus) dengan badge status & kondisi
- `/aset/[id]` — Detail aset: ubah kondisi, catat & selesaikan perawatan, riwayat kondisi, riwayat perawatan
- `/booking` — Booking ruang & aset: form pengajuan, daftar booking, tombol Setuju/Tolak Lv1 & Lv2, pengembalian aset
- `/jadwal` — Kalender harian: grid tanggal × ruang dengan blok booking berwarna per status
- `/perawatan` — Daftar perawatan aset + penyelesaian perawatan

## API

- `GET/POST /api/ruang`, `GET/PATCH/DELETE /api/ruang/[id]`
- `GET/POST /api/aset`, `GET/PATCH/DELETE /api/aset/[id]`, `POST /api/aset/[id]/kondisi`
- `GET/POST /api/booking-ruang` (`?date=`, `?status=`), `GET /api/booking-ruang/[id]`, `PATCH /api/booking-ruang/[id]/approve`
- `GET/POST /api/booking-aset` (`?status=`, `?date=`), `GET /api/booking-aset/[id]`, `PATCH /api/booking-aset/[id]/approve`, `POST /api/booking-aset/[id]/kembalikan`
- `GET/POST /api/perawatan` (`?aset_id=`), `PATCH /api/perawatan/[id]`
- `GET /api/riwayat` (`?aset_id=`)

## Aturan bisnis utama

- Booking ruang baru ditolak (409) jika bentrok jam dengan booking lain yang
  berstatus diajukan/disetujui_lv1/disetujui pada ruang & tanggal yang sama.
- Approval berjenjang: `diajukan → disetujui_lv1 → disetujui`; tolak di level
  mana pun → `ditolak`. Lompat level atau ubah booking final → 409. Setiap
  keputusan tercatat di tabel Persetujuan.
- Booking aset: aset harus `tersedia` dan tidak punya booking aktif yang
  beririsan tanggal, jika tidak → 409. Level 2 disetujui → aset `dipinjam`.
- Pengembalian aset: booking `disetujui` → `dikembalikan`, aset kembali
  `tersedia`, kondisi akhir tercatat di RiwayatKondisi.
- Perawatan: aset dipinjam tidak bisa dirawat (409); mulai perawatan → aset
  `dalam_perawatan`; selesai → kembali `tersedia` (atau `dipinjam` jika ada
  booking aktif) dan kondisi tercatat di RiwayatKondisi.

Lihat `PRD.md` untuk spesifikasi lengkap.
