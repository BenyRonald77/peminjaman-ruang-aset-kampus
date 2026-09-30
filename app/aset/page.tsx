"use client";
import { useEffect, useState } from "react";
import { STATUS_ASET_LABEL, STATUS_ASET_COLOR, KONDISI_LABEL } from "@/lib/ui";

type Aset = { id: number; nama: string; kode_unik: string; kategori: string; kondisi: string; status: string };

const empty = { nama: "", kode_unik: "", kategori: "" };

export default function AsetPage() {
  const [rows, setRows] = useState<Aset[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const load = () => fetch("/api/aset").then((r) => r.json()).then(setRows);
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const res = await fetch(editId ? `/api/aset/${editId}` : "/api/aset", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const j = await res.json();
    if (!res.ok) { setMsg(j.error); return; }
    setForm(empty); setEditId(null); load();
  };

  const hapus = async (id: number) => {
    if (!confirm("Hapus aset ini?")) return;
    const res = await fetch(`/api/aset/${id}`, { method: "DELETE" });
    const j = await res.json();
    if (!res.ok) { setMsg(j.error); return; }
    load();
  };

  const inp = "border rounded px-2 py-1 w-full";
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Master Data Aset</h1>
      {msg && <div className="mb-3 text-sm bg-blue-50 border border-blue-200 rounded p-2">{msg}</div>}
      <form onSubmit={submit} className="bg-white rounded shadow p-4 mb-6 grid md:grid-cols-3 gap-3">
        <div><label className="text-sm">Nama Aset</label><input className={inp} value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required /></div>
        <div><label className="text-sm">Kode Unik</label><input className={inp} value={form.kode_unik} onChange={(e) => setForm({ ...form, kode_unik: e.target.value })} required disabled={!!editId} /></div>
        <div><label className="text-sm">Kategori</label><input className={inp} value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} required /></div>
        <div className="md:col-span-3 flex gap-2">
          <button className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm">{editId ? "Simpan Perubahan" : "Tambah Aset"}</button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm(empty); }} className="bg-slate-200 px-4 py-1.5 rounded text-sm">Batal</button>}
        </div>
      </form>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((a) => (
          <div key={a.id} className="bg-white rounded shadow p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold">{a.nama}</div>
                <div className="text-xs text-slate-500">{a.kode_unik} · {a.kategori}</div>
              </div>
            </div>
            <div className="mt-2 space-x-2">
              <span className={`text-xs px-2 py-0.5 rounded ${STATUS_ASET_COLOR[a.status]}`}>{STATUS_ASET_LABEL[a.status]}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">{KONDISI_LABEL[a.kondisi]}</span>
            </div>
            <div className="mt-3 text-sm space-x-3">
              <a href={`/aset/${a.id}`} className="text-blue-600 hover:underline">Detail & Riwayat</a>
              <button onClick={() => { setEditId(a.id); setForm({ nama: a.nama, kode_unik: a.kode_unik, kategori: a.kategori }); }} className="text-blue-600 hover:underline">Edit</button>
              <button onClick={() => hapus(a.id)} className="text-red-600 hover:underline">Hapus</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
