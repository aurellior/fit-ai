'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, Dumbbell, Sparkles, Utensils, Zap } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
              FitPulse<span className="text-emerald-500">.AI</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
              Monolith Next.js
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <a
            href="#activities"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Aktivitas</span>
          </a>
          <a
            href="#ai-insights"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="hidden sm:inline">AI Insights</span>
          </a>
          <a
            href="#food-scanner"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Utensils className="w-4 h-4 text-purple-500" />
            <span className="hidden sm:inline">Food Scanner</span>
          </a>
          <a
            href="#manual-input"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all ml-2"
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>+ Catat Latihan</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
