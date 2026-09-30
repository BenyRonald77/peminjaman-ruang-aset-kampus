import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/booking";
import { err, ok } from "@/lib/api";

const KONDISI = ["baik", "rusak_ringan", "rusak_berat"];
const STATUS = ["tersedia", "dipinjam", "dalam_perawatan"];

const idParam = (p: { params: { id: string } }) => {
  const id = Number(p.params.id);
  if (!Number.isInteger(id)) throw new AppError(400, "id tidak valid");
  return id;
};

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const a = await prisma.aset.findUnique({ where: { id: idParam(ctx) } });
    if (!a) throw new AppError(404, "aset tidak ditemukan");
    return ok(a);
  } catch (e) {
    return err(e);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = idParam(ctx);
    const b = await req.json().catch(() => null);
    const a = await prisma.aset.findUnique({ where: { id } });
    if (!a) throw new AppError(404, "aset tidak ditemukan");
    const data: Record<string, unknown> = {};
    if (b?.nama !== undefined) data.nama = String(b.nama);
    if (b?.kategori !== undefined) data.kategori = String(b.kategori);
    if (b?.kode_unik !== undefined) {
      const dupe = await prisma.aset.findUnique({ where: { kode_unik: String(b.kode_unik) } });
      if (dupe && dupe.id !== id) throw new AppError(409, "kode_unik sudah dipakai");
      data.kode_unik = String(b.kode_unik);
    }
    if (b?.kondisi !== undefined) {
      if (!KONDISI.includes(b.kondisi)) throw new AppError(400, "kondisi tidak valid");
      data.kondisi = b.kondisi;
    }
    if (b?.status !== undefined) {
      if (!STATUS.includes(b.status)) throw new AppError(400, "status tidak valid");
      data.status = b.status;
    }
    const updated = await prisma.aset.update({ where: { id }, data });
    return ok(updated);
  } catch (e) {
    return err(e);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = idParam(ctx);
    const a = await prisma.aset.findUnique({ where: { id } });
    if (!a) throw new AppError(404, "aset tidak ditemukan");
    const aktif = await prisma.bookingAset.count({
      where: { aset_id: id, status: { in: ["diajukan", "disetujui_lv1", "disetujui"] } },
    });
    if (aktif > 0) throw new AppError(409, "aset masih punya booking aktif, tidak bisa dihapus");
    const perawatan = await prisma.perawatanAset.count({ where: { aset_id: id, selesai: false } });
    if (perawatan > 0) throw new AppError(409, "aset sedang dalam perawatan, tidak bisa dihapus");
    await prisma.aset.delete({ where: { id } });
    return ok({ ok: true });
  } catch (e) {
    return err(e);
  }
}
