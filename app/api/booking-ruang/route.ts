import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppError, cekBentrokRuang } from "@/lib/booking";
import { err, ok } from "@/lib/api";
import { nowIso, isValidDate, isValidTime } from "@/lib/format";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const date = sp.get("date");
  const status = sp.get("status");
  const rows = await prisma.bookingRuang.findMany({
    where: {
      ...(date ? { tanggal: date } : {}),
      ...(status ? { status } : {}),
    },
    include: { ruang: true },
    orderBy: [{ tanggal: "asc" }, { jam_mulai: "asc" }],
  });
  return ok(rows);
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => null);
    const ruang_id = Number(b?.ruang_id);
    if (!Number.isInteger(ruang_id)) throw new AppError(400, "ruang_id tidak valid");
    if (!b?.peminjam_nama) throw new AppError(400, "peminjam_nama wajib diisi");
    if (!isValidDate(b?.tanggal)) throw new AppError(400, "tanggal harus format YYYY-MM-DD");
    if (!isValidTime(b?.jam_mulai) || !isValidTime(b?.jam_selesai))
      throw new AppError(400, "jam_mulai/jam_selesai harus format HH:MM");
    if (b.jam_mulai >= b.jam_selesai) throw new AppError(400, "jam_mulai harus sebelum jam_selesai");
    const ruang = await prisma.ruang.findUnique({ where: { id: ruang_id } });
    if (!ruang) throw new AppError(404, "ruang tidak ditemukan");
    const bentrok = await cekBentrokRuang(ruang_id, b.tanggal, b.jam_mulai, b.jam_selesai);
    if (bentrok)
      throw new AppError(
        409,
        `bentrok dengan booking #${bentrok.id} (${bentrok.jam_mulai}-${bentrok.jam_selesai}, ${bentrok.peminjam_nama})`
      );
    const created = await prisma.bookingRuang.create({
      data: {
        ruang_id,
        peminjam_nama: String(b.peminjam_nama),
        keperluan: String(b.keperluan ?? ""),
        tanggal: b.tanggal,
        jam_mulai: b.jam_mulai,
        jam_selesai: b.jam_selesai,
        status: "diajukan",
        created_at: nowIso(),
      },
    });
    return ok(created, 201);
  } catch (e) {
    return err(e);
  }
}
