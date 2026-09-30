import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/booking";
import { err, ok } from "@/lib/api";
import { nowIso } from "@/lib/format";

export async function GET() {
  const rows = await prisma.ruang.findMany({ orderBy: { id: "asc" } });
  return ok(rows);
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => null);
    if (!b?.nama || !b?.gedung) throw new AppError(400, "nama dan gedung wajib diisi");
    const kapasitas = Number(b.kapasitas ?? 0);
    if (!Number.isInteger(kapasitas) || kapasitas < 0) throw new AppError(400, "kapasitas harus bilangan bulat >= 0");
    const ada = await prisma.ruang.findUnique({ where: { nama: b.nama } });
    if (ada) throw new AppError(409, "nama ruang sudah dipakai");
    const created = await prisma.ruang.create({
      data: {
        nama: String(b.nama),
        gedung: String(b.gedung),
        kapasitas,
        fasilitas: String(b.fasilitas ?? ""),
        created_at: nowIso(),
      },
    });
    return ok(created, 201);
  } catch (e) {
    return err(e);
  }
}
