"use client";
import { useEffect, useState } from "react";
import { STATUS_ASET_LABEL, STATUS_ASET_COLOR, KONDISI_LABEL } from "@/lib/ui";
import { rupiah, today } from "@/lib/format";

type Aset = { id: number; nama: string; kode_unik: string; kategori: string; kondisi: string; status: string };
type Riwayat = { id: number; tanggal: string; kondisi: string; catatan: string };
type Perawatan = { id: number; tanggal: string; jenis: string; keterangan: string; biaya: number; selesai: boolean };

export default function AsetDetail({ params }: { params: { id: string } }) {
  const [aset, setAset] = useState<Aset | null>(null);
  const [riwayat, setRiwayat] = useState<Riwayat[]>([]);
  const [perawatan, setPerawatan] = useState<Perawatan[]>([]);
  const [msg, setMsg] = useState("");
  const [kondisiForm, setKondisiForm] = useState({ kondisi: "baik", catatan: "" });
  const [rawatForm, setRawatForm] = useState({ tanggal: today(), jenis: "Servis rutin", keterangan: "", biaya: 0 });

  const load = async () => {
    const a = await fetch(`/api/aset/${params.id}`).then((r) => r.json());
    setAset(a.id ? a : null);
    const rw = await fetch(`/api/riwayat?aset_id=${params.id}`).then((r) => r.json()).catch(() => []);
    setRiwayat(Array.isArray(rw) ? rw : []);
    const pr = await fetch(`/api/perawatan?aset_id=${params.id}`).then((r) => r.json());
    setPerawatan(Array.isArray(pr) ? pr : []);
  };
  useEffect(() => { load(); }, []);

  const ubahKondisi = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/aset/${params.id}/kondisi`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(kondisiForm),
    });
    const j = await res.json();
    if (!res.ok) { setMsg(j.error); return; }
    setMsg("Kondisi diperbarui dan tercatat di riwayat."); load();
  };

  const mulaiRawat = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/perawatan", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rawatForm, aset_id: Number(params.id) }),
    });
    const j = await res.json();
    if (!res.ok) { setMsg(j.error); return; }
    setMsg("Perawatan dicatat, aset masuk status dalam perawatan."); load();
  };

  const selesaiRawat = async (id: number) => {
    const kondisi_akhir = prompt("Kondisi aset setelah perawatan (baik/rusak_ringan/rusak_berat):", "baik") || "baik";
    const res = await fetch(`/api/perawatan/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selesai: true, kondisi_akhir }),
    });
    const j = await res.json();
    if (!res.ok) { setMsg(j.error); return; }
    setMsg("Perawatan selesai, aset kembali tersedia."); load();
  };

  const inp = "border rounded px-2 py-1 w-full text-sm";
  if (!aset) return <p className="text-slate-500">Memuat...</p>;
  return (
    <div>
      <a href="/aset" className="text-sm text-blue-600 hover:underline">← Kembali ke daftar aset</a>
      <h1 className="text-2xl font-bold mt-2 mb-4">{aset.nama}</h1>
      {msg && <div className="mb-3 text-sm bg-blue-50 border border-blue-200 rounded p-2">{msg}</div>}
      <div className="bg-white rounded shadow p-4 mb-6">
        <div className="text-sm space-y-1">
          <div>Kode: <b>{aset.kode_unik}</b> · Kategori: {aset.kategori}</div>
          <div className="space-x-2">
            <span className={`text-xs px-2 py-0.5 rounded ${STATUS_ASET_COLOR[aset.status]}`}>{STATUS_ASET_LABEL[aset.status]}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100">{KONDISI_LABEL[aset.kondisi]}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-bold mb-2">Ubah Kondisi</h2>
          <form onSubmit={ubahKondisi} className="bg-white rounded shadow p-4 space-y-2 mb-6">
            <select className={inp} value={kondisiForm.kondisi} onChange={(e) => setKondisiForm({ ...kondisiForm, kondisi: e.target.value })}>
              <option value="baik">Baik</option>
              <option value="rusak_ringan">Rusak Ringan</option>
              <option value="rusak_berat">Rusak Berat</option>
            </select>
            <input className={inp} placeholder="Catatan" value={kondisiForm.catatan} onChange={(e) => setKondisiForm({ ...kondisiForm, catatan: e.target.value })} />
            <button className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm">Simpan Kondisi</button>
          </form>

          <h2 className="font-bold mb-2">Riwayat Kondisi</h2>
          <div className="bg-white rounded shadow p-4">
            {riwayat.length === 0 && <p className="text-sm text-slate-400">Belum ada riwayat.</p>}
            <ul className="space-y-2 text-sm">
              {riwayat.map((r) => (
                <li key={r.id} className="border-b pb-2">
                  <b>{r.tanggal}</b> — {KONDISI_LABEL[r.kondisi]}
                  {r.catatan && <div className="text-slate-500">{r.catatan}</div>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h2 className="font-bold mb-2">Catat Perawatan</h2>
          <form onSubmit={mulaiRawat} className="bg-white rounded shadow p-4 space-y-2 mb-6">
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className={inp} value={rawatForm.tanggal} onChange={(e) => setRawatForm({ ...rawatForm, tanggal: e.target.value })} required />
              <input className={inp} placeholder="Jenis (Servis rutin, Perbaikan...)" value={rawatForm.jenis} onChange={(e) => setRawatForm({ ...rawatForm, jenis: e.target.value })} required />
            </div>
            <input className={inp} placeholder="Keterangan" value={rawatForm.keterangan} onChange={(e) => setRawatForm({ ...rawatForm, keterangan: e.target.value })} />
            <input type="number" min={0} className={inp} placeholder="Biaya" value={rawatForm.biaya} onChange={(e) => setRawatForm({ ...rawatForm, biaya: Number(e.target.value) })} />
            <button className="bg-orange-600 text-white px-4 py-1.5 rounded text-sm">Mulai Perawatan</button>
          </form>

          <h2 className="font-bold mb-2">Riwayat Perawatan</h2>
          <div className="bg-white rounded shadow p-4">
            {perawatan.length === 0 && <p className="text-sm text-slate-400">Belum ada perawatan.</p>}
            <ul className="space-y-2 text-sm">
              {perawatan.map((p) => (
                <li key={p.id} className="border-b pb-2">
                  <b>{p.tanggal}</b> — {p.jenis} · {rupiah(p.biaya)}
                  {p.keterangan && <div className="text-slate-500">{p.keterangan}</div>}
                  <div className="mt-1">
                    {p.selesai
                      ? <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">Selesai</span>
                      : <button onClick={() => selesaiRawat(p.id)} className="text-xs px-2 py-0.5 rounded bg-orange-600 text-white">Selesaikan</button>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
