"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { STATUS_BOOKING_LABEL } from "@/lib/ui";
import { today } from "@/lib/format";

type Ruang = { id: number; nama: string };
type BR = { id: number; ruang_id: number; peminjam_nama: string; keperluan: string; jam_mulai: string; jam_selesai: string; status: string };

const JAM_MULAI = 7, JAM_SELESAI = 22;
const WARNA: Record<string, string> = {
  diajukan: "bg-yellow-300 border-yellow-500",
  disetujui_lv1: "bg-blue-300 border-blue-500",
  disetujui: "bg-green-300 border-green-500",
  ditolak: "bg-red-200 border-red-400",
  dikembalikan: "bg-slate-200 border-slate-400",
};

function JadwalInner() {
  const sp = useSearchParams();
  const [tanggal, setTanggal] = useState(sp.get("date") || today());
  const [ruangs, setRuangs] = useState<Ruang[]>([]);
  const [bookings, setBookings] = useState<BR[]>([]);

  useEffect(() => {
    fetch("/api/ruang").then((r) => r.json()).then(setRuangs);
  }, []);
  useEffect(() => {
    fetch(`/api/booking-ruang?date=${tanggal}`).then((r) => r.json()).then(setBookings);
  }, [tanggal]);

  const jamList: number[] = [];
  for (let h = JAM_MULAI; h < JAM_SELESAI; h++) jamList.push(h);

  const blokUntuk = (ruangId: number, jam: number) =>
    bookings.filter((b) => {
      if (b.ruang_id !== ruangId) return false;
      const m1 = Number(b.jam_mulai.slice(0, 2)) * 60 + Number(b.jam_mulai.slice(3, 5));
      const m2 = Number(b.jam_selesai.slice(0, 2)) * 60 + Number(b.jam_selesai.slice(3, 5));
      return m1 < (jam + 1) * 60 && m2 > jam * 60;
    });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Jadwal Peminjaman Ruang</h1>
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm">Tanggal:</label>
        <input type="date" className="border rounded px-2 py-1" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
      </div>
      <div className="mb-4 flex gap-3 text-xs">
        <span><span className="inline-block w-3 h-3 bg-yellow-300 rounded mr-1" />Diajukan</span>
        <span><span className="inline-block w-3 h-3 bg-blue-300 rounded mr-1" />Disetujui Lv.1</span>
        <span><span className="inline-block w-3 h-3 bg-green-300 rounded mr-1" />Disetujui</span>
        <span><span className="inline-block w-3 h-3 bg-red-200 rounded mr-1" />Ditolak</span>
      </div>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="p-2 border bg-slate-100 w-20">Jam</th>
              {ruangs.map((r) => (
                <th key={r.id} className="p-2 border bg-slate-100">{r.nama}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jamList.map((jam) => (
              <tr key={jam}>
                <td className="p-1 border text-center text-xs text-slate-500">{String(jam).padStart(2, "0")}:00</td>
                {ruangs.map((r) => {
                  const bloks = blokUntuk(r.id, jam);
                  return (
                    <td key={r.id} className="p-1 border align-top h-12">
                      {bloks.map((b) => (
                        <div key={b.id} className={`text-xs rounded border-l-4 p-1 mb-1 ${WARNA[b.status] ?? "bg-slate-200"}`} title={`${b.jam_mulai}-${b.jam_selesai} · ${b.peminjam_nama} · ${b.keperluan}`}>
                          <b>{b.jam_mulai}–{b.jam_selesai}</b> {b.peminjam_nama}
                          <div className="opacity-75">{STATUS_BOOKING_LABEL[b.status]}</div>
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function JadwalPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Memuat jadwal...</p>}>
      <JadwalInner />
    </Suspense>
  );
}
