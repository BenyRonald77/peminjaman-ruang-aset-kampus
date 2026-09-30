// Label & warna untuk komponen client (bebas dari import server).
export const STATUS_BOOKING_LABEL: Record<string, string> = {
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

export const STATUS_ASET_LABEL: Record<string, string> = {
  tersedia: "Tersedia",
  dipinjam: "Dipinjam",
  dalam_perawatan: "Dalam Perawatan",
};

export const STATUS_ASET_COLOR: Record<string, string> = {
  tersedia: "bg-green-100 text-green-800",
  dipinjam: "bg-yellow-100 text-yellow-800",
  dalam_perawatan: "bg-orange-100 text-orange-800",
};

export const KONDISI_LABEL: Record<string, string> = {
  baik: "Baik",
  rusak_ringan: "Rusak Ringan",
  rusak_berat: "Rusak Berat",
};
