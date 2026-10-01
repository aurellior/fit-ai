'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, Sparkles } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service or server console
    console.error('FitPulse App Router Error Boundary caught an error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-6">
        {/* Warning Icon Badge */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs">
          <AlertTriangle className="w-7 h-7 stroke-[2]" />
        </div>

        {/* Error Info */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
            <span>Runtime Exception Detected</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Terjadi Kendala Sistem
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
            Sistem FitPulse AI mendeteksi gangguan saat memproses data. Anda dapat mencoba memuat ulang komponen atau kembali ke beranda dashboard.
          </p>
        </div>

        {/* Error Digest (if available) */}
        {error.digest && (
          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-[11px] font-mono text-zinc-500 truncate text-left">
            <span className="text-zinc-400 font-semibold block text-[10px] uppercase">Digest ID:</span>
            <span>{error.digest}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#FC5200] hover:bg-[#E04800] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer min-h-[44px] active:scale-98"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Coba Muat Ulang</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors min-h-[44px]"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Ke Dashboard</span>
          </Link>
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 font-mono">
          <Sparkles className="w-3 h-3 text-[#FC5200]" />
          <span>FitPulse AI Resilience Engine</span>
        </div>
      </div>
    </div>
  );
}
