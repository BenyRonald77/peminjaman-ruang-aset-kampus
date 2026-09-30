import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/booking";
import { err, ok } from "@/lib/api";

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id)) throw new AppError(400, "id tidak valid");
    const b = await prisma.bookingAset.findUnique({ where: { id }, include: { aset: true } });
    if (!b) throw new AppError(404, "booking aset tidak ditemukan");
    const riwayat = await prisma.persetujuan.findMany({
      where: { booking_type: "aset", booking_id: id },
      orderBy: { id: "asc" },
    });
    return ok({ ...b, persetujuan: riwayat });
  } catch (e) {
    return err(e);
  }
}
