export const rupiah = (n: number) =>
  "Rp" + Math.round(n).toLocaleString("id-ID");

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const addDays = (ymd: string, n: number) => {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

export const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export const nowIso = () => new Date().toISOString();

export const isValidDate = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));

export const isValidTime = (s: unknown): s is string =>
  typeof s === "string" && /^([01]\d|2[03]):[0-5]\d$/.test(s);

export const STATUS_BOOKING: Record<string, string> = {
  diajukan: "Diajukan",
  disetujui_lv1: "Disetujui Lv.1",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  dikembalikan: "Dikembalikan",
};

export const STATUS_BOOKING_COLOR: Record<string, string> = {
  diajukan: "bg-yellow-100 text-yellow-800",
  disetujui_lv1: "bg-blue-100 text-blue-800",
  disetujui: "bg-green-100 text-green-800",
  ditolak: "bg-red-100 text-red-800",
  dikembalikan: "bg-slate-200 text-slate-700",
};

export const KONDISI_LABEL: Record<string, string> = {
  baik: "Baik",
  rusak_ringan: "Rusak Ringan",
  rusak_berat: "Rusak Berat",
};

export const STATUS_ASET_LABEL: Record<string, string> = {
  tersedia: "Tersedia",
  dipinjam: "Dipinjam",
  dalam_perawatan: "Dalam Perawatan",
};
