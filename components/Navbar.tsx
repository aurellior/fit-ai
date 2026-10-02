'use client';

import React from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { Sparkles } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors pt-[env(safe-area-inset-top)]">
      <div className="w-full px-4 h-14 flex items-center justify-between">
        {/* Mobile App Brand Header */}
        <Link href="/" className="flex items-center gap-2 group active:scale-95 transition-transform">
          <div className="w-7 h-7 rounded-lg bg-[#FC5200] flex items-center justify-center text-white shadow-xs">
            <span className="font-black text-xs tracking-tighter">F</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
              FitPulse<span className="text-[#FC5200]">AI</span>
            </span>
            <span className="text-[9px] font-mono font-bold text-[#FC5200] bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-200/80 dark:border-orange-900/60 uppercase tracking-wider">
              PRO
            </span>
          </div>
        </Link>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* Live AI Engine Status Pill */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
            <Sparkles className="w-3 h-3 text-[#FC5200]" />
            <span className="font-semibold">Gemini AI</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

