import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/booking";
import { err, ok } from "@/lib/api";

const idParam = (p: { params: { id: string } }) => {
  const id = Number(p.params.id);
  if (!Number.isInteger(id)) throw new AppError(400, "id tidak valid");
  return id;
};

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const r = await prisma.ruang.findUnique({ where: { id: idParam(ctx) } });
    if (!r) throw new AppError(404, "ruang tidak ditemukan");
    return ok(r);
  } catch (e) {
    return err(e);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = idParam(ctx);
    const b = await req.json().catch(() => null);
    const r = await prisma.ruang.findUnique({ where: { id } });
    if (!r) throw new AppError(404, "ruang tidak ditemukan");
    const data: Record<string, unknown> = {};
    if (b?.nama !== undefined) {
      const dupe = await prisma.ruang.findUnique({ where: { nama: String(b.nama) } });
      if (dupe && dupe.id !== id) throw new AppError(409, "nama ruang sudah dipakai");
      data.nama = String(b.nama);
    }
    if (b?.gedung !== undefined) data.gedung = String(b.gedung);
    if (b?.fasilitas !== undefined) data.fasilitas = String(b.fasilitas);
    if (b?.kapasitas !== undefined) {
      const k = Number(b.kapasitas);
      if (!Number.isInteger(k) || k < 0) throw new AppError(400, "kapasitas harus bilangan bulat >= 0");
      data.kapasitas = k;
    }
    const updated = await prisma.ruang.update({ where: { id }, data });
    return ok(updated);
  } catch (e) {
    return err(e);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = idParam(ctx);
    const r = await prisma.ruang.findUnique({ where: { id } });
    if (!r) throw new AppError(404, "ruang tidak ditemukan");
    const aktif = await prisma.bookingRuang.count({
      where: { ruang_id: id, status: { in: ["diajukan", "disetujui_lv1", "disetujui"] } },
    });
    if (aktif > 0) throw new AppError(409, "ruang masih punya booking aktif, tidak bisa dihapus");
    await prisma.ruang.delete({ where: { id } });
    return ok({ ok: true });
  } catch (e) {
    return err(e);
  }
}
