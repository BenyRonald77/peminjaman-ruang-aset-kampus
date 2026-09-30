import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/booking";
import { err, ok } from "@/lib/api";
import { nowIso } from "@/lib/format";

const KONDISI = ["baik", "rusak_ringan", "rusak_berat"];

// POST /api/booking-aset/[id]/kembalikan {kondisi_akhir, catatan}
export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id)) throw new AppError(400, "id tidak valid");
    const b = await req.json().catch(() => null);
    if (!b?.kondisi_akhir || !KONDISI.includes(b.kondisi_akhir))
      throw new AppError(400, "kondisi_akhir tidak valid");
    const booking = await prisma.bookingAset.findUnique({ where: { id } });
    if (!booking) throw new AppError(404, "booking aset tidak ditemukan");
    if (booking.status !== "disetujui")
      throw new AppError(409, "hanya booking berstatus disetujui yang bisa dikembalikan");
    const t = nowIso();
    await prisma.$transaction([
      prisma.bookingAset.update({ where: { id }, data: { status: "dikembalikan" } }),
      prisma.aset.update({
        where: { id: booking.aset_id },
        data: { status: "tersedia", kondisi: b.kondisi_akhir },
      }),
      prisma.riwayatKondisi.create({
        data: {
          aset_id: booking.aset_id,
          tanggal: t.slice(0, 10),
          kondisi: b.kondisi_akhir,
          catatan: `Pengembalian booking #${id} oleh ${booking.peminjam_nama}. ${String(b.catatan ?? "")}`.trim(),
          created_at: t,
        },
      }),
    ]);
    return ok({ id, status: "dikembalikan" });
  } catch (e) {
    return err(e);
  }
}
