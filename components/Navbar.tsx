'use client';

import React from 'react';
import Link from 'next/link';

import ThemeToggle from '@/components/ThemeToggle';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-600"></div>
          <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
            FitAI
          </span>
          <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            v1.0
          </span>
        </Link>

        <nav className="flex items-center gap-6 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <a
            href="#overview"
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Overview
          </a>
          <a
            href="#activities"
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Aktivitas
          </a>
          <a
            href="#insights"
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Intelligence
          </a>
          <a
            href="#nutrition"
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Nutrisi
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="#manual-input"
            className="text-xs font-medium px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
          >
            + Catat Latihan
          </a>
        </div>
      </div>
    </header>
  );
}
