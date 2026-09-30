"use client";
import { useEffect, useState } from "react";
import { rupiah } from "@/lib/format";

type P = { id: number; aset_id: number; tanggal: string; jenis: string; keterangan: string; biaya: number; selesai: boolean; aset?: { nama: string; kode_unik: string } };

export default function PerawatanPage() {
  const [rows, setRows] = useState<P[]>([]);
  const [msg, setMsg] = useState("");
  const load = () => fetch("/api/perawatan").then((r) => r.json()).then(setRows);
  useEffect(() => { load(); }, []);

  const selesaikan = async (id: number) => {
    const kondisi_akhir = prompt("Kondisi aset setelah perawatan (baik/rusak_ringan/rusak_berat):", "baik") || "baik";
    const res = await fetch(`/api/perawatan/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selesai: true, kondisi_akhir }),
    });
    const j = await res.json();
    if (!res.ok) { setMsg(j.error); return; }
    setMsg("Perawatan diselesaikan."); load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Perawatan Aset</h1>
      {msg && <div className="mb-3 text-sm bg-blue-50 border border-blue-200 rounded p-2">{msg}</div>}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-100 text-left"><th className="p-2">Tanggal</th><th className="p-2">Aset</th><th className="p-2">Jenis</th><th className="p-2">Keterangan</th><th className="p-2">Biaya</th><th className="p-2">Status</th><th className="p-2">Aksi</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.tanggal}</td>
                <td className="p-2">{p.aset?.nama} <span className="text-slate-400 text-xs">({p.aset?.kode_unik})</span></td>
                <td className="p-2">{p.jenis}</td>
                <td className="p-2">{p.keterangan}</td>
                <td className="p-2">{rupiah(p.biaya)}</td>
                <td className="p-2">
                  {p.selesai
                    ? <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">Selesai</span>
                    : <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-800">Berjalan</span>}
                </td>
                <td className="p-2">
                  {!p.selesai && <button onClick={() => selesaikan(p.id)} className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded">Selesaikan</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
