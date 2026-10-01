import React from 'react';
import Link from 'next/link';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-6">
        {/* 404 Icon */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 flex items-center justify-center text-[#FC5200] shadow-xs">
          <Compass className="w-7 h-7 stroke-[2]" />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            <span>Error 404 • Resource Not Found</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
            Aktivitas, log nutrisi, atau halaman yang Anda cari mungkin telah dihapus, dipindahkan, atau ID yang dimasukkan tidak terdaftar.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-4 py-2.5 bg-[#FC5200] hover:bg-[#E04800] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs min-h-[44px] active:scale-98"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Kembali ke Dashboard</span>
          </Link>

          <Link
            href="/activities"
            className="w-full sm:w-auto px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Lihat Aktivitas</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
