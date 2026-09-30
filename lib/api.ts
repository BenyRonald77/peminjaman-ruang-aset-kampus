// Helper respons error JSON standar.
import { NextResponse } from "next/server";
import { AppError } from "@/lib/booking";

export function err(e: unknown) {
  if (e instanceof AppError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(e);
  return NextResponse.json({ error: "kesalahan server" }, { status: 500 });
}

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });
