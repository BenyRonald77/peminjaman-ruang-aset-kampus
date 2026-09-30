import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/booking";
import { err, ok } from "@/lib/api";
import { nowIso } from "@/lib/format";

const KONDISI = ["baik", "rusak_ringan", "rusak_berat"];
const STATUS = ["tersedia", "dipinjam", "dalam_perawatan"];

export async function GET() {
  const rows = await prisma.aset.findMany({ orderBy: { id: "asc" } });
  return ok(rows);
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => null);
    if (!b?.nama || !b?.kode_unik || !b?.kategori)
      throw new AppError(400, "nama, kode_unik, dan kategori wajib diisi");
    if (b.kondisi !== undefined && !KONDISI.includes(b.kondisi)) throw new AppError(400, "kondisi tidak valid");
    if (b.status !== undefined && !STATUS.includes(b.status)) throw new AppError(400, "status tidak valid");
    const ada = await prisma.aset.findUnique({ where: { kode_unik: String(b.kode_unik) } });
    if (ada) throw new AppError(409, "kode_unik sudah dipakai");
    const created = await prisma.$transaction(async (tx) => {
      const aset = await tx.aset.create({
        data: {
          nama: String(b.nama),
          kode_unik: String(b.kode_unik),
          kategori: String(b.kategori),
          kondisi: b.kondisi ?? "baik",
          status: b.status ?? "tersedia",
          created_at: nowIso(),
        },
      });
      await tx.riwayatKondisi.create({
        data: {
          aset_id: aset.id,
          tanggal: nowIso().slice(0, 10),
          kondisi: aset.kondisi,
          catatan: "Aset baru didaftarkan",
          created_at: nowIso(),
        },
      });
      return aset;
    });
    return ok(created, 201);
  } catch (e) {
    return err(e);
  }
}
