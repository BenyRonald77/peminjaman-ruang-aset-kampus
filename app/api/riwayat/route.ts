import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  const aset_id = req.nextUrl.searchParams.get("aset_id");
  const rows = await prisma.riwayatKondisi.findMany({
    where: aset_id ? { aset_id: Number(aset_id) } : {},
    include: { aset: true },
    orderBy: [{ tanggal: "desc" }, { id: "desc" }],
  });
  return ok(rows);
}
