"use client";
import { useEffect, useState } from "react";
import { STATUS_BOOKING_LABEL, STATUS_BOOKING_COLOR } from "@/lib/ui";
import { today } from "@/lib/format";

type Ruang = { id: number; nama: string };
type Aset = { id: number; nama: string; kode_unik: string; status: string };
type BR = { id: number; ruang_id: number; peminjam_nama: string; keperluan: string; tanggal: string; jam_mulai: string; jam_selesai: string; status: string; ruang?: Ruang };
type BA = { id: number; aset_id: number; peminjam_nama: string; keperluan: string; tanggal_pinjam: string; tanggal_kembali: string; status: string; aset?: Aset };

export default function BookingPage() {
  const [tab, setTab] = useState<"ruang" | "aset">("ruang");
  const [ruangs, setRuangs] = useState<Ruang[]>([]);
  const [asets, setAsets] = useState<Aset[]>([]);
  const [brs, setBrs] = useState<BR[]>([]);
  const [bas, setBas] = useState<BA[]>([]);
  const [msg, setMsg] = useState("");
  const [fr, setFr] = useState({ ruang_id: "", peminjam_nama: "", keperluan: "", tanggal: today(), jam_mulai: "08:00", jam_selesai: "10:00" });
  const [fa, setFa] = useState({ aset_id: "", peminjam_nama: "", keperluan: "", tanggal_pinjam: today(), tanggal_kembali: today() });

  const load = async () => {
    setRuangs(await fetch("/api/ruang").then((r) => r.json()));
    setAsets(await fetch("/api/aset").then((r) => r.json()));
    setBrs(await fetch("/api/booking-ruang").then((r) => r.json()));
    setBas(await fetch("/api/booking-aset").then((r) => r.json()));
  };
  useEffect(() => { load(); }, []);

  const submitRuang = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    const res = await fetch("/api/booking-ruang", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fr, ruang_id: Number(fr.ruang_id) }) });
    const j = await res.json();
    if (!res.ok) { setMsg(j.error); return; }
    setMsg(`Booking ruang #${j.id} dibuat (diajukan).`); load();
  };

  const submitAset = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    const res = await fetch("/api/booking-aset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fa, aset_id: Number(fa.aset_id) }) });
    const j = await res.json();
    if (!res.ok) { setMsg(j.error); return; }
    setMsg(`Booking aset #${j.id} dibuat (diajukan).`); load();
  };

  const putuskan = async (type: "ruang" | "aset", id: number, level: number, keputusan: "setuju" | "tolak") => {
    const catatan = prompt(`Catatan ${keputusan} level ${level}:`, "") ?? "";
    const res = await fetch(`/api/booking-${type}/${id}/approve`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, keputusan, catatan }),
    });
    const j = await res.json();
    if (!res.ok) { setMsg(j.error); return; }
    setMsg(`Booking #${id} → ${j.status}.`); load();
  };

  const kembalikan = async (id: number) => {
    const kondisi_akhir = prompt("Kondisi akhir aset (baik/rusak_ringan/rusak_berat):", "baik") || "baik";
    const catatan = prompt("Catatan pengembalian:", "") ?? "";
    const res = await fetch(`/api/booking-aset/${id}/kembalikan`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kondisi_akhir, catatan }),
    });
    const j = await res.json();
    if (!res.ok) { setMsg(j.error); return; }
    setMsg(`Booking aset #${id} dikembalikan.`); load();
  };

  const inp = "border rounded px-2 py-1 w-full text-sm";
  const btnLv = (type: "ruang" | "aset", b: BR | BA) => (
    <span className="space-x-1">
      {(b.status === "diajukan" || b.status === "disetujui_lv1") && (
        <>
          {b.status === "diajukan" && (
            <>
              <button onClick={() => putuskan(type, b.id, 1, "setuju")} className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">Setuju Lv1</button>
              <button onClick={() => putuskan(type, b.id, 1, "tolak")} className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">Tolak Lv1</button>
            </>
          )}
          {b.status === "disetujui_lv1" && (
            <>
              <button onClick={() => putuskan(type, b.id, 2, "setuju")} className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">Setuju Lv2</button>
              <button onClick={() => putuskan(type, b.id, 2, "tolak")} className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">Tolak Lv2</button>
            </>
          )}
        </>
      )}
      {type === "aset" && b.status === "disetujui" && (
        <button onClick={() => kembalikan(b.id)} className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">Kembalikan</button>
      )}
    </span>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Booking Ruang & Aset</h1>
      {msg && <div className="mb-3 text-sm bg-blue-50 border border-blue-200 rounded p-2">{msg}</div>}
      <div className="mb-4 space-x-2">
        <button onClick={() => setTab("ruang")} className={`px-4 py-1.5 rounded text-sm ${tab === "ruang" ? "bg-slate-900 text-white" : "bg-white"}`}>Booking Ruang</button>
        <button onClick={() => setTab("aset")} className={`px-4 py-1.5 rounded text-sm ${tab === "aset" ? "bg-slate-900 text-white" : "bg-white"}`}>Booking Aset</button>
      </div>

      {tab === "ruang" && (
        <>
          <form onSubmit={submitRuang} className="bg-white rounded shadow p-4 mb-6 grid md:grid-cols-3 gap-3">
            <div><label className="text-sm">Ruang</label><select className={inp} value={fr.ruang_id} onChange={(e) => setFr({ ...fr, ruang_id: e.target.value })} required><option value="">— pilih —</option>{ruangs.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}</select></div>
            <div><label className="text-sm">Nama Peminjam</label><input className={inp} value={fr.peminjam_nama} onChange={(e) => setFr({ ...fr, peminjam_nama: e.target.value })} required /></div>
            <div><label className="text-sm">Keperluan</label><input className={inp} value={fr.keperluan} onChange={(e) => setFr({ ...fr, keperluan: e.target.value })} /></div>
            <div><label className="text-sm">Tanggal</label><input type="date" className={inp} value={fr.tanggal} onChange={(e) => setFr({ ...fr, tanggal: e.target.value })} required /></div>
            <div><label className="text-sm">Jam Mulai</label><input type="time" className={inp} value={fr.jam_mulai} onChange={(e) => setFr({ ...fr, jam_mulai: e.target.value })} required /></div>
            <div><label className="text-sm">Jam Selesai</label><input type="time" className={inp} value={fr.jam_selesai} onChange={(e) => setFr({ ...fr, jam_selesai: e.target.value })} required /></div>
            <div className="md:col-span-3"><button className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm">Ajukan Booking</button></div>
          </form>
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-100 text-left"><th className="p-2">ID</th><th className="p-2">Ruang</th><th className="p-2">Tanggal</th><th className="p-2">Jam</th><th className="p-2">Peminjam</th><th className="p-2">Status</th><th className="p-2">Aksi</th></tr></thead>
              <tbody>
                {brs.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="p-2">{b.id}</td>
                    <td className="p-2">{b.ruang?.nama}</td>
                    <td className="p-2">{b.tanggal}</td>
                    <td className="p-2">{b.jam_mulai}–{b.jam_selesai}</td>
                    <td className="p-2">{b.peminjam_nama}</td>
                    <td className="p-2"><span className={`text-xs px-2 py-0.5 rounded ${STATUS_BOOKING_COLOR[b.status]}`}>{STATUS_BOOKING_LABEL[b.status]}</span></td>
                    <td className="p-2">{btnLv("ruang", b)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "aset" && (
        <>
          <form onSubmit={submitAset} className="bg-white rounded shadow p-4 mb-6 grid md:grid-cols-3 gap-3">
            <div><label className="text-sm">Aset</label><select className={inp} value={fa.aset_id} onChange={(e) => setFa({ ...fa, aset_id: e.target.value })} required><option value="">— pilih —</option>{asets.map((a) => <option key={a.id} value={a.id}>{a.nama} ({a.kode_unik}) — {a.status}</option>)}</select></div>
            <div><label className="text-sm">Nama Peminjam</label><input className={inp} value={fa.peminjam_nama} onChange={(e) => setFa({ ...fa, peminjam_nama: e.target.value })} required /></div>
            <div><label className="text-sm">Keperluan</label><input className={inp} value={fa.keperluan} onChange={(e) => setFa({ ...fa, keperluan: e.target.value })} /></div>
            <div><label className="text-sm">Tanggal Pinjam</label><input type="date" className={inp} value={fa.tanggal_pinjam} onChange={(e) => setFa({ ...fa, tanggal_pinjam: e.target.value })} required /></div>
            <div><label className="text-sm">Tanggal Kembali</label><input type="date" className={inp} value={fa.tanggal_kembali} onChange={(e) => setFa({ ...fa, tanggal_kembali: e.target.value })} required /></div>
            <div className="md:col-span-3"><button className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm">Ajukan Booking</button></div>
          </form>
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-100 text-left"><th className="p-2">ID</th><th className="p-2">Aset</th><th className="p-2">Pinjam</th><th className="p-2">Kembali</th><th className="p-2">Peminjam</th><th className="p-2">Status</th><th className="p-2">Aksi</th></tr></thead>
              <tbody>
                {bas.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="p-2">{b.id}</td>
                    <td className="p-2">{b.aset?.nama}</td>
                    <td className="p-2">{b.tanggal_pinjam}</td>
                    <td className="p-2">{b.tanggal_kembali}</td>
                    <td className="p-2">{b.peminjam_nama}</td>
                    <td className="p-2"><span className={`text-xs px-2 py-0.5 rounded ${STATUS_BOOKING_COLOR[b.status]}`}>{STATUS_BOOKING_LABEL[b.status]}</span></td>
                    <td className="p-2">{btnLv("aset", b)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
