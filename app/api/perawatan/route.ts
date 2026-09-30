import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/booking";
import { err, ok } from "@/lib/api";
import { nowIso, isValidDate } from "@/lib/format";

export async function GET(req: NextRequest) {
  const aset_id = req.nextUrl.searchParams.get("aset_id");
  const rows = await prisma.perawatanAset.findMany({
    where: aset_id ? { aset_id: Number(aset_id) } : {},
    include: { aset: true },
    orderBy: [{ tanggal: "desc" }, { id: "desc" }],
  });
  return ok(rows);
}

// POST /api/perawatan — catat perawatan, aset -> dalam_perawatan
export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => null);
    const aset_id = Number(b?.aset_id);
    if (!Number.isInteger(aset_id)) throw new AppError(400, "aset_id tidak valid");
    if (!isValidDate(b?.tanggal)) throw new AppError(400, "tanggal harus format YYYY-MM-DD");
    if (!b?.jenis) throw new AppError(400, "jenis perawatan wajib diisi");
    const aset = await prisma.aset.findUnique({ where: { id: aset_id } });
    if (!aset) throw new AppError(404, "aset tidak ditemukan");
    if (aset.status === "dipinjam") throw new AppError(409, "aset sedang dipinjam, tidak bisa dirawat");
    if (aset.status === "dalam_perawatan") throw new AppError(409, "aset sudah dalam perawatan");
    const biaya = Number(b.biaya ?? 0);
    if (!Number.isInteger(biaya) || biaya < 0) throw new AppError(400, "biaya harus bilangan bulat >= 0");
    const [created] = await prisma.$transaction([
      prisma.perawatanAset.create({
        data: {
          aset_id,
          tanggal: b.tanggal,
          jenis: String(b.jenis),
          keterangan: String(b.keterangan ?? ""),
          biaya,
          selesai: false,
          created_at: nowIso(),
        },
      }),
      prisma.aset.update({ where: { id: aset_id }, data: { status: "dalam_perawatan" } }),
    ]);
    return ok(created, 201);
  } catch (e) {
    return err(e);
  }
}
