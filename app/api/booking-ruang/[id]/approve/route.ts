import { NextRequest } from "next/server";
import { AppError, prosesPersetujuan } from "@/lib/booking";
import { err, ok } from "@/lib/api";

// PATCH /api/booking-ruang/[id]/approve {level: 1|2, keputusan: setuju|tolak, catatan}
export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id)) throw new AppError(400, "id tidak valid");
    const b = await req.json().catch(() => null);
    const baru = await prosesPersetujuan("ruang", id, Number(b?.level), b?.keputusan, String(b?.catatan ?? ""));
    return ok({ id, status: baru });
  } catch (e) {
    return err(e);
  }
}
