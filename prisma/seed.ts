import { PrismaClient } from "@prisma/client";
import { today, addDays, nowIso } from "../lib/format";

const prisma = new PrismaClient();

async function main() {
  const n = await prisma.ruang.count();
  if (n > 0) {
    console.log("seed dilewati (sudah ada data)");
    return;
  }
  const t = today();

  const ruang1 = await prisma.ruang.create({
    data: { nama: "Aula Utama", gedung: "Gedung A", kapasitas: 200, fasilitas: "Proyektor + Sound System + AC", created_at: nowIso() },
  });
  const ruang2 = await prisma.ruang.create({
    data: { nama: "Ruang Rapat 1", gedung: "Gedung B", kapasitas: 30, fasilitas: "Whiteboard + AC", created_at: nowIso() },
  });
  const ruang3 = await prisma.ruang.create({
    data: { nama: "Lab Komputer", gedung: "Gedung C", kapasitas: 40, fasilitas: "30 PC + Proyektor", created_at: nowIso() },
  });

  const asetData = [
    { nama: "Proyektor Epson EB-X49", kode_unik: "PRJ-001", kategori: "Proyektor" },
    { nama: "Laptop Dell Latitude 5440", kode_unik: "LPT-001", kategori: "Laptop" },
    { nama: "Sound System Yamaha", kode_unik: "SND-001", kategori: "Sound System" },
    { nama: "Mic Wireless Shure", kode_unik: "MIC-001", kategori: "Audio" },
    { nama: "Whiteboard Mobile", kode_unik: "WBD-001", kategori: "Furniture" },
  ];
  const asets = [];
  for (const a of asetData) {
    const aset = await prisma.aset.create({ data: { ...a, kondisi: "baik", status: "tersedia", created_at: nowIso() } });
    asets.push(aset);
    await prisma.riwayatKondisi.create({
      data: { aset_id: aset.id, tanggal: t, kondisi: "baik", catatan: "Kondisi awal inventaris", created_at: nowIso() },
    });
  }

  // Contoh booking ruang: 1 diajukan, 1 disetujui (dengan riwayat persetujuan lv1+lv2)
  await prisma.bookingRuang.create({
    data: {
      ruang_id: ruang1.id,
      peminjam_nama: "Himpunan Mahasiswa Jurusan",
      keperluan: "Rapat koordinasi panitia",
      tanggal: addDays(t, 2),
      jam_mulai: "10:00",
      jam_selesai: "12:00",
      status: "diajukan",
      created_at: nowIso(),
    },
  });
  const brDisetujui = await prisma.bookingRuang.create({
    data: {
      ruang_id: ruang3.id,
      peminjam_nama: "Panitia Seminar Nasional",
      keperluan: "Seminar teknologi informasi",
      tanggal: addDays(t, 5),
      jam_mulai: "09:00",
      jam_selesai: "12:00",
      status: "disetujui",
      created_at: nowIso(),
    },
  });
  for (const lv of [1, 2]) {
    await prisma.persetujuan.create({
      data: {
        booking_type: "ruang",
        booking_id: brDisetujui.id,
        level: lv,
        keputusan: "setuju",
        catatan: lv === 1 ? "Disetujui kabag umum" : "Disetujui wakil rektor",
        diputus_pada: nowIso(),
      },
    });
  }

  // Contoh booking aset disetujui -> aset PRJ-001 berstatus dipinjam
  const ba = await prisma.bookingAset.create({
    data: {
      aset_id: asets[0].id,
      peminjam_nama: "Unit Kegiatan Mahasiswa",
      keperluan: "Presentasi lomba",
      tanggal_pinjam: t,
      tanggal_kembali: addDays(t, 3),
      status: "disetujui",
      created_at: nowIso(),
    },
  });
  for (const lv of [1, 2]) {
    await prisma.persetujuan.create({
      data: {
        booking_type: "aset",
        booking_id: ba.id,
        level: lv,
        keputusan: "setuju",
        catatan: lv === 1 ? "Disetujui kabag umum" : "Disetujui wakil rektor",
        diputus_pada: nowIso(),
      },
    });
  }
  await prisma.aset.update({ where: { id: asets[0].id }, data: { status: "dipinjam" } });

  console.log("seed selesai");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
