"use client";
import { useEffect, useState } from "react";

type Ruang = { id: number; nama: string; gedung: string; kapasitas: number; fasilitas: string };

const empty = { nama: "", gedung: "", kapasitas: 0, fasilitas: "" };

export default function RuangPage() {
  const [rows, setRows] = useState<Ruang[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const load = () => fetch("/api/ruang").then((r) => r.json()).then(setRows);
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const res = await fetch(editId ? `/api/ruang/${editId}` : "/api/ruang", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const j = await res.json();
    if (!res.ok) { setMsg(j.error); return; }
    setForm(empty); setEditId(null); load();
    setMsg(editId ? "Ruang diperbarui." : "Ruang ditambahkan.");
  };

  const hapus = async (id: number) => {
    if (!confirm("Hapus ruang ini?")) return;
    const res = await fetch(`/api/ruang/${id}`, { method: "DELETE" });
    const j = await res.json();
    if (!res.ok) { setMsg(j.error); return; }
    load();
  };

  const mulaiEdit = (r: Ruang) => {
    setEditId(r.id);
    setForm({ nama: r.nama, gedung: r.gedung, kapasitas: r.kapasitas, fasilitas: r.fasilitas });
  };

  const inp = "border rounded px-2 py-1 w-full";
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Master Data Ruang</h1>
      {msg && <div className="mb-3 text-sm bg-blue-50 border border-blue-200 rounded p-2">{msg}</div>}
      <form onSubmit={submit} className="bg-white rounded shadow p-4 mb-6 grid md:grid-cols-2 gap-3">
        <div><label className="text-sm">Nama Ruang</label><input className={inp} value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required /></div>
        <div><label className="text-sm">Gedung</label><input className={inp} value={form.gedung} onChange={(e) => setForm({ ...form, gedung: e.target.value })} required /></div>
        <div><label className="text-sm">Kapasitas</label><input type="number" min={0} className={inp} value={form.kapasitas} onChange={(e) => setForm({ ...form, kapasitas: Number(e.target.value) })} /></div>
        <div><label className="text-sm">Fasilitas</label><input className={inp} value={form.fasilitas} onChange={(e) => setForm({ ...form, fasilitas: e.target.value })} /></div>
        <div className="md:col-span-2 flex gap-2">
          <button className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm">{editId ? "Simpan Perubahan" : "Tambah Ruang"}</button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm(empty); }} className="bg-slate-200 px-4 py-1.5 rounded text-sm">Batal</button>}
        </div>
      </form>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-100 text-left"><th className="p-2">Nama</th><th className="p-2">Gedung</th><th className="p-2">Kapasitas</th><th className="p-2">Fasilitas</th><th className="p-2">Aksi</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 font-medium">{r.nama}</td>
                <td className="p-2">{r.gedung}</td>
                <td className="p-2">{r.kapasitas} orang</td>
                <td className="p-2">{r.fasilitas}</td>
                <td className="p-2 space-x-2">
                  <button onClick={() => mulaiEdit(r)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => hapus(r.id)} className="text-red-600 hover:underline">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
