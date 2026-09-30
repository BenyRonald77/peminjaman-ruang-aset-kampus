import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/booking";
import { err, ok } from "@/lib/api";
import { nowIso } from "@/lib/format";

// PATCH /api/perawatan/[id] {selesai: true, kondisi_akhir?} — selesaikan perawatan
export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id)) throw new AppError(400, "id tidak valid");
    const b = await req.json().catch(() => null);
    const p = await prisma.perawatanAset.findUnique({ where: { id } });
    if (!p) throw new AppError(404, "data perawatan tidak ditemukan");
    if (p.selesai) throw new AppError(409, "perawatan sudah selesai");
    if (b?.selesai !== true) throw new AppError(400, "body harus {selesai: true}");

    const KONDISI = ["baik", "rusak_ringan", "rusak_berat"];
    const kondisiAkhir = b.kondisi_akhir ?? "baik";
    if (!KONDISI.includes(kondisiAkhir)) throw new AppError(400, "kondisi_akhir tidak valid");

    const bookingAktif = await prisma.bookingAset.count({
      where: { aset_id: p.aset_id, status: { in: ["diajukan", "disetujui_lv1", "disetujui"] } },
    });
    const t = nowIso();
    const ops: any[] = [
      prisma.perawatanAset.update({ where: { id }, data: { selesai: true } }),
      prisma.aset.update({
        where: { id: p.aset_id },
        data: {
          status: bookingAktif > 0 ? "dipinjam" : "tersedia",
          kondisi: kondisiAkhir,
        },
      }),
      prisma.riwayatKondisi.create({
        data: {
          aset_id: p.aset_id,
          tanggal: t.slice(0, 10),
          kondisi: kondisiAkhir,
          catatan: `Perawatan selesai (${p.jenis}). ${String(b.catatan ?? "")}`.trim(),
          created_at: t,
        },
      }),
    ];
    await prisma.$transaction(ops);
    return ok({ id, selesai: true });
  } catch (e) {
    return err(e);
  }
}
