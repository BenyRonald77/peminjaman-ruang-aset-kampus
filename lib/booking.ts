// Logika bisnis peminjaman ruang & aset (dipakai API routes, bukan diekspor dari route).
import { prisma } from "./prisma";

export class AppError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const ACTIVE_RUANG = ["diajukan", "disetujui_lv1", "disetujui"];
export const ACTIVE_ASET = ["diajukan", "disetujui_lv1", "disetujui"];

// Rentang jam [mulai, selesai) beririsan?
export function jamOverlap(a1: string, a2: string, b1: string, b2: string) {
  return a1 < b2 && a2 > b1;
}

// Rentang tanggal [pinjam, kembali] beririsan?
export function tanggalOverlap(a1: string, a2: string, b1: string, b2: string) {
  return a1 <= b2 && a2 >= b1;
}

export async function cekBentrokRuang(
  ruang_id: number,
  tanggal: string,
  jam_mulai: string,
  jam_selesai: string,
  kecualiId?: number
) {
  const rows = await prisma.bookingRuang.findMany({
    where: {
      ruang_id,
      tanggal,
      status: { in: ACTIVE_RUANG },
      ...(kecualiId ? { NOT: { id: kecualiId } } : {}),
    },
  });
  return rows.find((r) => jamOverlap(jam_mulai, jam_selesai, r.jam_mulai, r.jam_selesai)) ?? null;
}

export async function cekBentrokAset(
  aset_id: number,
  tanggal_pinjam: string,
  tanggal_kembali: string,
  kecualiId?: number
) {
  const rows = await prisma.bookingAset.findMany({
    where: {
      aset_id,
      status: { in: ACTIVE_ASET },
      ...(kecualiId ? { NOT: { id: kecualiId } } : {}),
    },
  });
  return (
    rows.find((r) => tanggalOverlap(tanggal_pinjam, tanggal_kembali, r.tanggal_pinjam, r.tanggal_kembali)) ?? null
  );
}

// Transisi persetujuan berjenjang. Mengembalikan status baru.
export async function prosesPersetujuan(
  type: "ruang" | "aset",
  bookingId: number,
  level: number,
  keputusan: "setuju" | "tolak",
  catatan: string
): Promise<string> {
  if (level !== 1 && level !== 2) throw new AppError(400, "level harus 1 atau 2");
  if (keputusan !== "setuju" && keputusan !== "tolak") throw new AppError(400, "keputusan harus setuju atau tolak");

  if (type === "ruang") {
    const b = await prisma.bookingRuang.findUnique({ where: { id: bookingId } });
    if (!b) throw new AppError(404, "booking ruang tidak ditemukan");
    if (b.status === "ditolak" || b.status === "disetujui")
      throw new AppError(409, "booking sudah final, tidak bisa diputuskan lagi");
    let baru: string;
    if (level === 1) {
      if (b.status !== "diajukan") throw new AppError(409, "persetujuan level 1 hanya untuk status diajukan");
      baru = keputusan === "setuju" ? "disetujui_lv1" : "ditolak";
    } else {
      if (b.status !== "disetujui_lv1")
        throw new AppError(409, "persetujuan level 2 hanya untuk status disetujui_lv1 (lewati level 1 tidak boleh)");
      baru = keputusan === "setuju" ? "disetujui" : "ditolak";
    }
    await prisma.$transaction([
      prisma.bookingRuang.update({ where: { id: bookingId }, data: { status: baru } }),
      prisma.persetujuan.create({
        data: {
          booking_type: "ruang",
          booking_id: bookingId,
          level,
          keputusan,
          catatan: catatan ?? "",
          diputus_pada: new Date().toISOString(),
        },
      }),
    ]);
    return baru;
  }

  const b = await prisma.bookingAset.findUnique({ where: { id: bookingId }, include: { aset: true } });
  if (!b) throw new AppError(404, "booking aset tidak ditemukan");
  if (b.status === "ditolak" || b.status === "disetujui" || b.status === "dikembalikan")
    throw new AppError(409, "booking sudah final, tidak bisa diputuskan lagi");
  let baru: string;
  if (level === 1) {
    if (b.status !== "diajukan") throw new AppError(409, "persetujuan level 1 hanya untuk status diajukan");
    baru = keputusan === "setuju" ? "disetujui_lv1" : "ditolak";
  } else {
    if (b.status !== "disetujui_lv1")
      throw new AppError(409, "persetujuan level 2 hanya untuk status disetujui_lv1 (lewati level 1 tidak boleh)");
    baru = keputusan === "setuju" ? "disetujui" : "ditolak";
  }
  const ops: any[] = [
    prisma.bookingAset.update({ where: { id: bookingId }, data: { status: baru } }),
    prisma.persetujuan.create({
      data: {
        booking_type: "aset",
        booking_id: bookingId,
        level,
        keputusan,
        catatan: catatan ?? "",
        diputus_pada: new Date().toISOString(),
      },
    }),
  ];
  if (baru === "disetujui") {
    ops.push(prisma.aset.update({ where: { id: b.aset_id }, data: { status: "dipinjam" } }));
  }
  await prisma.$transaction(ops);
  return baru;
}
