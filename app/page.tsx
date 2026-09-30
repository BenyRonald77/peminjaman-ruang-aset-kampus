import { prisma } from "@/lib/prisma";
import { STATUS_BOOKING_LABEL, STATUS_BOOKING_COLOR, STATUS_ASET_LABEL } from "@/lib/ui";
import { today, rupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getStats() {
  const [ruang, asetTersedia, asetDipinjam, asetPerawatan, brMenunggu, baMenunggu, perawatanJalan] =
    await Promise.all([
      prisma.ruang.count(),
      prisma.aset.count({ where: { status: "tersedia" } }),
      prisma.aset.count({ where: { status: "dipinjam" } }),
      prisma.aset.count({ where: { status: "dalam_perawatan" } }),
      prisma.bookingRuang.count({ where: { status: { in: ["diajukan", "disetujui_lv1"] } } }),
      prisma.bookingAset.count({ where: { status: { in: ["diajukan", "disetujui_lv1"] } } }),
      prisma.perawatanAset.findMany({
        where: { selesai: false },
        include: { aset: true },
        orderBy: { tanggal: "desc" },
        take: 5,
      }),
    ]);
  const bookingTerbaru = await prisma.bookingRuang.findMany({
    include: { ruang: true },
    orderBy: { id: "desc" },
    take: 5,
  });
  return { ruang, asetTersedia, asetDipinjam, asetPerawatan, brMenunggu, baMenunggu, perawatanJalan, bookingTerbaru };
}

function Card({ title, value, sub }: { title: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

export default async function Dashboard() {
  const s = await getStats();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard — Peminjaman Ruang & Aset Kampus</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card title="Total Ruang" value={s.ruang} />
        <Card title="Aset Tersedia" value={s.asetTersedia} />
        <Card title="Aset Dipinjam" value={s.asetDipinjam} />
        <Card title="Aset Perawatan" value={s.asetPerawatan} />
        <Card title="Booking Ruang Menunggu" value={s.brMenunggu} sub="diajukan / lv1" />
        <Card title="Booking Aset Menunggu" value={s.baMenunggu} sub="diajukan / lv1" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-bold mb-3">Booking Ruang Terbaru</h2>
          {s.bookingTerbaru.length === 0 && <p className="text-slate-400 text-sm">Belum ada booking.</p>}
          <ul className="space-y-2">
            {s.bookingTerbaru.map((b) => (
              <li key={b.id} className="text-sm border-b pb-2">
                <span className="font-medium">{b.ruang.nama}</span> — {b.tanggal} {b.jam_mulai}–{b.jam_selesai}
                <div className="text-slate-500">{b.peminjam_nama} · {b.keperluan}</div>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${STATUS_BOOKING_COLOR[b.status]}`}>
                  {STATUS_BOOKING_LABEL[b.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-bold mb-3">Perawatan Berjalan</h2>
          {s.perawatanJalan.length === 0 && <p className="text-slate-400 text-sm">Tidak ada perawatan berjalan.</p>}
          <ul className="space-y-2">
            {s.perawatanJalan.map((p) => (
              <li key={p.id} className="text-sm border-b pb-2">
                <span className="font-medium">{p.aset.nama}</span> ({p.aset.kode_unik})
                <div className="text-slate-500">
                  {p.tanggal} · {p.jenis} · {rupiah(p.biaya)}
                </div>
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                  {STATUS_ASET_LABEL.dalam_perawatan}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-400 mt-3">Hari ini: {today()}</p>
        </div>
      </div>
    </div>
  );
}
