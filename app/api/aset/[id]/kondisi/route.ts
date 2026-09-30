import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/booking";
import { err, ok } from "@/lib/api";
import { nowIso, isValidDate } from "@/lib/format";

const KONDISI = ["baik", "rusak_ringan", "rusak_berat"];

// POST /api/aset/[id]/kondisi — ubah kondisi + catat riwayat
export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id)) throw new AppError(400, "id tidak valid");
    const b = await req.json().catch(() => null);
    if (!b?.kondisi || !KONDISI.includes(b.kondisi)) throw new AppError(400, "kondisi tidak valid");
    const a = await prisma.aset.findUnique({ where: { id } });
    if (!a) throw new AppError(404, "aset tidak ditemukan");
    const tanggal = isValidDate(b.tanggal) ? b.tanggal : nowIso().slice(0, 10);
    const [updated] = await prisma.$transaction([
      prisma.aset.update({ where: { id }, data: { kondisi: b.kondisi } }),
      prisma.riwayatKondisi.create({
        data: {
          aset_id: id,
          tanggal,
          kondisi: b.kondisi,
          catatan: String(b.catatan ?? ""),
          created_at: nowIso(),
        },
      }),
    ]);
    return ok(updated);
  } catch (e) {
    return err(e);
  }
}
