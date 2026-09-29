'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { Plus } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const isOverview = pathname === '/' || pathname === '/dashboard';
  const isActivities = pathname.startsWith('/activities');
  const isNutrition = pathname.startsWith('/nutrition');

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand Logo (Strava-inspired athletic minimalism) */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-6 h-6 rounded-md bg-[#FC5200] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <span className="font-black text-xs tracking-tighter">F</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
              Fit<span className="text-[#FC5200]">AI</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-200/60 dark:border-zinc-700/60">
              ATHLETE
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links with Active Indicators */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              isOverview
                ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-semibold'
                : 'hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
            }`}
          >
            Overview
          </Link>
          <Link
            href="/activities"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              isActivities
                ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-semibold'
                : 'hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
            }`}
          >
            Aktivitas
          </Link>
          <Link
            href="/nutrition"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              isNutrition
                ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-semibold'
                : 'hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
            }`}
          >
            Nutrisi
          </Link>
          <Link
            href="/#insights"
            className="px-3 py-1.5 rounded-md transition-colors hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
          >
            Intelligence
          </Link>
        </nav>

        {/* Right Action Icons & Direct Action Link */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/activities"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-md bg-[#FC5200] hover:bg-[#E04900] text-white transition-colors shadow-xs active:scale-98"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Sesi Latihan</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
