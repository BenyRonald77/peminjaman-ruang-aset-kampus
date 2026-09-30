import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peminjaman Ruang & Aset Kampus",
  description: "Sistem peminjaman ruang dan aset kampus dengan approval berjenjang",
};

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="px-3 py-2 rounded hover:bg-slate-700 text-sm font-medium">
      {label}
    </a>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen text-slate-900">
        <nav className="bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
            <a href="/" className="font-bold mr-4">🏫 Pinjam Kampus</a>
            <NavLink href="/" label="Dashboard" />
            <NavLink href="/ruang" label="Ruang" />
            <NavLink href="/aset" label="Aset" />
            <NavLink href="/booking" label="Booking" />
            <NavLink href="/jadwal" label="Jadwal" />
            <NavLink href="/perawatan" label="Perawatan" />
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
