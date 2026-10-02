'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock';
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

const emptySubscribe = () => () => {};

export default function BottomNav({
  onOpenActivityModal,
  onOpenFoodModal,
  onOpenWeightModal,
}: BottomNavProps) {
  const pathname = usePathname();
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Kunci scroll body saat bottom sheet menu aksi cepat terbuka
  useBodyScrollLock(isFabMenuOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFabMenuOpen(false);
    };

    if (isFabMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isFabMenuOpen]);

  const isOverview = pathname === '/' || pathname === '/dashboard';
  const isActivities = pathname.startsWith('/activities');
  const isCoach = pathname.startsWith('/coach');
  const isNutrition = pathname.startsWith('/nutrition');

  const handleAction = (callback: () => void) => {
    setIsFabMenuOpen(false);
    callback();
  };

  const sheetContent = isFabMenuOpen ? (
    <div className="fixed inset-0 z-50 flex flex-col justify-end p-0 sm:p-3 overflow-hidden isolate m-0">
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={() => setIsFabMenuOpen(false)}
        onTouchMove={(e) => e.preventDefault()}
      />

      <div className="relative w-full max-w-md mx-auto bg-white dark:bg-[#121214] border-t sm:border border-zinc-200 dark:border-zinc-800/90 rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 pb-[max(1.75rem,calc(1rem+env(safe-area-inset-bottom)))] mb-0 sm:mb-[max(0.5rem,env(safe-area-inset-bottom))] space-y-3.5 z-10 shadow-2xl overscroll-contain max-h-[85dvh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
        {/* Sheet Grab Handle */}
        <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-1 shrink-0" />

        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FC5200]" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono">
              Aksi Cepat Atlet
            </span>
          </div>
          <button
            onClick={() => setIsFabMenuOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer active:scale-90 transition-transform"
            aria-label="Tutup menu aksi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5 pt-1">
          <button
            onClick={() => handleAction(onOpenActivityModal)}
            className="flex items-center gap-3.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/50 text-left transition-all active:scale-98 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FC5200] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Catat Latihan (Lari & Gym)
              </div>
              <div className="text-[11px] text-zinc-500 truncate">
                Input jarak, pace lari, atau repetisi beban
              </div>
            </div>
          </button>

          <button
            onClick={() => handleAction(onOpenFoodModal)}
            className="flex items-center gap-3.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/50 text-left transition-all active:scale-98 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Scan Makanan AI
              </div>
              <div className="text-[11px] text-zinc-500 truncate">
                Foto makanan untuk ekstraksi kalori & makro
              </div>
            </div>
          </button>

          <button
            onClick={() => handleAction(onOpenWeightModal)}
            className="flex items-center gap-3.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/50 text-left transition-all active:scale-98 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Catat Berat Badan
              </div>
              <div className="text-[11px] text-zinc-500 truncate">
                Pantau tren massa tubuh harian
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Mobile Speed Dial / Action Sheet Overlay Portaled to document.body */}
      {isClient && isFabMenuOpen && typeof document !== 'undefined'
        ? createPortal(sheetContent, document.body)
        : null}

      {/* Floating Liquid Glass Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none pb-floating-nav px-4 sm:px-6">
        <nav className="w-full max-w-sm pointer-events-auto backdrop-blur-2xl bg-white/80 dark:bg-zinc-900/80 border border-white/40 dark:border-zinc-700/30 rounded-full shadow-2xl px-3 py-1.5 touch-manipulation">
          <div className="h-12 flex items-center justify-between gap-1">
            {/* Dashboard Tab */}
            <Link
              href="/"
              prefetch={true}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-full transition-all active:scale-95 ${
                isOverview
                  ? 'text-[#FC5200] font-bold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">Overview</span>
            </Link>

            {/* AI Coach Tab */}
            <Link
              href="/ai-coach"
              prefetch={true}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-full transition-all active:scale-95 ${
                isCoach
                  ? 'text-[#FC5200] font-bold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              <div className="relative">
                <Activity className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#FC5200] animate-pulse"></span>
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">AI Coach</span>
            </Link>

            {/* Central Floating Elevated Action Button */}
            <div className="flex items-center justify-center px-1">
              <button
                onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
                className="w-11 h-11 rounded-full bg-[#FC5200] hover:bg-[#E04900] text-white flex items-center justify-center shadow-lg shadow-orange-500/25 ring-2 ring-white/60 dark:ring-zinc-800/80 active:scale-90 transition-all touch-manipulation cursor-pointer shrink-0"
                title="Aksi Cepat"
                aria-label="Aksi Cepat"
              >
                <Plus className={`w-5 h-5 transition-transform duration-200 stroke-[2.5] ${isFabMenuOpen ? 'rotate-45' : ''}`} />
              </button>
            </div>

            {/* Activities Tab */}
            <Link
              href="/activities"
              prefetch={true}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-full transition-all active:scale-95 ${
                isActivities
                  ? 'text-[#FC5200] font-bold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">Aktivitas</span>
            </Link>

            {/* Nutrition Tab */}
            <Link
              href="/nutrition"
              prefetch={true}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-full transition-all active:scale-95 ${
                isNutrition
                  ? 'text-[#FC5200] font-bold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">Nutrisi</span>
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
