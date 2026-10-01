'use client';

import React, { useState, useTransition } from 'react';
import { Footprints, ShieldCheck, Check, Loader2, ArrowUpRight, Flame, Target } from 'lucide-react';
import { DailyNutritionAuditData } from '@/types';
import { logDailyStepsAction } from '@/actions/steps';

interface DailyStepCheckInCardProps {
  auditData?: DailyNutritionAuditData | null;
  onCheckInSuccess?: () => void;
}

export default function DailyStepCheckInCard({
  auditData,
  onCheckInSuccess,
}: DailyStepCheckInCardProps) {
  const [isPending, startTransition] = useTransition();
  const [stepInput, setStepInput] = useState<string>(
    auditData?.totalDailySteps ? String(auditData.totalDailySteps) : ''
  );
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Today's date string format: YYYY-MM-DD
  const targetDateStr = auditData?.date || new Date().toISOString().split('T')[0];
  const totalSteps = auditData?.totalDailySteps || 0;
  const targetGoal = 10000;
  const progressPercent = Math.min(100, Math.round((totalSteps / targetGoal) * 100));

  const handleQuickAdd = (increment: number) => {
    const current = parseInt(stepInput, 10) || totalSteps || 0;
    const newVal = current + increment;
    setStepInput(String(newVal));
  };

  const handleSetTarget = (target: number) => {
    setStepInput(String(target));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(stepInput, 10);
    if (isNaN(count) || count < 0) {
      setErrorMessage('Masukkan jumlah langkah yang valid');
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      try {
        const res = await logDailyStepsAction({
          dateStr: targetDateStr,
          stepCount: count,
          source: 'MANUAL',
        });

        if (res.success) {
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 3000);
          if (onCheckInSuccess) onCheckInSuccess();
        } else {
          setErrorMessage(res.error || 'Gagal menyimpan langkah harian');
        }
      } catch (err) {
        console.error('Check-in steps error:', err);
        setErrorMessage('Terjadi kendala saat menyimpan check-in langkah');
      }
    });
  };

  return (
    <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FC5200]/10 flex items-center justify-center text-[#FC5200] shrink-0">
            <Footprints className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>Daily Step Check-in</span>
              <span className="text-[10px] font-mono font-normal text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                NEAT
              </span>
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Sinkronisasi langkah harian ke pengeluaran energi murni
            </p>
          </div>
        </div>

        {/* Protection Shield Indicator */}
        {auditData?.doubleCountingPrevented ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Anti-Duplikasi Aktif</span>
          </span>
        ) : (
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded shrink-0">
            Hari Ini
          </span>
        )}
      </div>

      {/* Progress & Stat Cards */}
      <div className="pt-3.5 space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
              Total Langkah Terlacak
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
              {totalSteps.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-normal font-sans text-zinc-500">langkah</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-zinc-400 font-mono flex items-center justify-end gap-1">
              <Target className="w-3 h-3 text-zinc-400" />
              <span>Target: {targetGoal.toLocaleString('id-ID')}</span>
            </span>
            <div className="text-xs font-semibold font-mono text-[#FC5200]">
              {progressPercent}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FC5200] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Biomechanical Isolation Breakdown: Strava vs NEAT */}
        {auditData?.hasStepsLogged && (
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
              <span className="text-[10px] text-zinc-400 uppercase font-mono block">
                🏃 Sesi Strava
              </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono text-xs tabular-nums">
                {auditData.workoutStepsAbsorbed.toLocaleString('id-ID')}{' '}
                <span className="text-[10px] text-zinc-400 font-normal">langkah</span>
              </span>
              <p className="text-[10px] text-zinc-400 mt-0.5">Terserap di latihan</p>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
              <span className="text-[10px] text-zinc-400 uppercase font-mono flex items-center justify-between">
                <span>🚶 NEAT Murni</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                  +{auditData.neatCalories} kkal
                </span>
              </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono text-xs tabular-nums">
                {auditData.pureNeatSteps.toLocaleString('id-ID')}{' '}
                <span className="text-[10px] text-zinc-400 font-normal">langkah</span>
              </span>
              <p className="text-[10px] text-zinc-400 mt-0.5">Mobilitas di luar sesi</p>
            </div>
          </div>
        )}

        {/* Anti-double counting badge if saved calories exist */}
        {auditData?.doubleCountingPrevented && (
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300">
            <Flame className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Hemat {auditData.deduplicatedCaloriesSaved} kkal:</strong> Langkah saat latihan Strava tidak dihitung dua kali ke NEAT.
            </span>
          </div>
        )}

        {/* Input Form Ala Strava */}
        <form onSubmit={handleSubmit} className="pt-2 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                min="0"
                max="100000"
                placeholder="Ketik total langkah hari ini..."
                value={stepInput}
                onChange={(e) => setStepInput(e.target.value)}
                disabled={isPending}
                className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FC5200] focus:border-[#FC5200] transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-mono">
                langkah
              </span>
            </div>

            <button
              type="submit"
              disabled={isPending || !stepInput}
              className="py-2 px-3.5 bg-[#FC5200] hover:bg-[#E04800] text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 shadow-xs cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Menyimpan...</span>
                </>
              ) : isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <span>Check-in</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-zinc-400 font-mono">Shortcut:</span>
            <button
              type="button"
              onClick={() => handleQuickAdd(1000)}
              disabled={isPending}
              className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              +1.000
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd(2500)}
              disabled={isPending}
              className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              +2.500
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd(5000)}
              disabled={isPending}
              className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              +5.000
            </button>
            <button
              type="button"
              onClick={() => handleSetTarget(10000)}
              disabled={isPending}
              className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              Target 10k
            </button>
          </div>

          {errorMessage && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 pt-1">
              {errorMessage}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
