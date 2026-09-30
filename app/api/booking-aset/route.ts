import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppError, cekBentrokAset } from "@/lib/booking";
import { err, ok } from "@/lib/api";
import { nowIso, isValidDate } from "@/lib/format";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const date = sp.get("date");
  const rows = await prisma.bookingAset.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(date ? { tanggal_pinjam: { lte: date }, tanggal_kembali: { gte: date } } : {}),
    },
    include: { aset: true },
    orderBy: [{ tanggal_pinjam: "asc" }, { id: "asc" }],
  });
  return ok(rows);
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => null);
    const aset_id = Number(b?.aset_id);
    if (!Number.isInteger(aset_id)) throw new AppError(400, "aset_id tidak valid");
    if (!b?.peminjam_nama) throw new AppError(400, "peminjam_nama wajib diisi");
    if (!isValidDate(b?.tanggal_pinjam) || !isValidDate(b?.tanggal_kembali))
      throw new AppError(400, "tanggal_pinjam/tanggal_kembali harus format YYYY-MM-DD");
    if (b.tanggal_kembali < b.tanggal_pinjam)
      throw new AppError(400, "tanggal_kembali tidak boleh sebelum tanggal_pinjam");
    const aset = await prisma.aset.findUnique({ where: { id: aset_id } });
    if (!aset) throw new AppError(404, "aset tidak ditemukan");
    if (aset.status !== "tersedia")
      throw new AppError(409, `aset sedang ${aset.status.replace(/_/g, " ")}, tidak bisa dipinjam`);
    const bentrok = await cekBentrokAset(aset_id, b.tanggal_pinjam, b.tanggal_kembali);
    if (bentrok)
      throw new AppError(
        409,
        `aset sudah dibooking #${bentrok.id} (${bentrok.tanggal_pinjam} s/d ${bentrok.tanggal_kembali}, ${bentrok.peminjam_nama})`
      );
    const created = await prisma.bookingAset.create({
      data: {
        aset_id,
        peminjam_nama: String(b.peminjam_nama),
        keperluan: String(b.keperluan ?? ""),
        tanggal_pinjam: b.tanggal_pinjam,
        tanggal_kembali: b.tanggal_kembali,
        status: "diajukan",
        created_at: nowIso(),
      },
    });
    return ok(created, 201);
  } catch (e) {
    return err(e);
  }
}
