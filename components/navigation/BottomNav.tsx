'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  Camera,
  Utensils,
  Plus,
  Dumbbell,
  Scale,
  X,
} from 'lucide-react';

interface BottomNavProps {
  onOpenActivityModal: () => void;
  onOpenFoodModal: () => void;
  onOpenWeightModal: () => void;
}

export default function BottomNav({
  onOpenActivityModal,
  onOpenFoodModal,
  onOpenWeightModal,
}: BottomNavProps) {
  const pathname = usePathname();
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  const isOverview = pathname === '/' || pathname === '/dashboard';
  const isActivities = pathname.startsWith('/activities');
  const isCoach = pathname.startsWith('/coach');
  const isNutrition = pathname.startsWith('/nutrition');

  const handleAction = (callback: () => void) => {
    setIsFabMenuOpen(false);
    callback();
  };

  return (
    <>
      {/* Mobile Speed Dial / Action Sheet Overlay */}
      {isFabMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end overflow-hidden isolate">
          <div
            className="absolute inset-0 bg-black/60 dark:bg-black/80 transition-opacity"
            onClick={() => setIsFabMenuOpen(false)}
          />

          <div className="relative bg-white dark:bg-[#121214] border-t border-zinc-200 dark:border-zinc-800 rounded-t-2xl p-5 pb-8 space-y-3 z-10 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">
                Aksi Cepat Atlet
              </span>
              <button
                onClick={() => setIsFabMenuOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                onClick={() => handleAction(onOpenActivityModal)}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[#FC5200] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Catat Latihan (Lari & Gym)
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Input durasi, pace lari, atau repetisi beban
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleAction(onOpenFoodModal)}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Scan Makanan AI
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Foto makanan untuk ekstraksi kalori & makro
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleAction(onOpenWeightModal)}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Catat Berat Badan
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Pantau tren massa tubuh harian
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thumb-friendly Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-800/80 md:hidden">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          {/* Dashboard Tab */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              isOverview
                ? 'text-[#FC5200] font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[10px] mt-1">Overview</span>
          </Link>

          {/* AI Coach Tab */}
          <Link
            href="/ai-coach"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              isCoach
                ? 'text-[#FC5200] font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <div className="relative">
              <Activity className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#FC5200]"></span>
            </div>
            <span className="text-[10px] mt-1">AI Coach</span>
          </Link>

          {/* Central Elevated FAB Trigger */}
          <div className="flex items-center justify-center px-2">
            <button
              onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
              className="w-11 h-11 rounded-full bg-[#FC5200] hover:bg-[#E04900] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
              title="Aksi Cepat"
              aria-label="Aksi Cepat"
            >
              <Plus className={`w-5 h-5 transition-transform duration-200 stroke-[2.5] ${isFabMenuOpen ? 'rotate-45' : ''}`} />
            </button>
          </div>

          {/* Activities Tab */}
          <Link
            href="/activities"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              isActivities
                ? 'text-[#FC5200] font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="text-[10px] mt-1">Aktivitas</span>
          </Link>

          {/* Nutrition Tab */}
          <Link
            href="/nutrition"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              isNutrition
                ? 'text-[#FC5200] font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span className="text-[10px] mt-1">Nutrisi</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
