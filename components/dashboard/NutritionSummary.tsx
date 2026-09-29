'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { deleteFoodLog } from '@/actions/nutrition';
import { FoodLogData } from '@/types';

interface NutritionSummaryProps {
  foodLogs: FoodLogData[];
  onLogDeleted?: () => void;
  isOverview?: boolean;
}

export default function NutritionSummary({
  foodLogs,
  onLogDeleted,
  isOverview = false,
}: NutritionSummaryProps) {
  const totalCalories = foodLogs.reduce((acc, curr) => acc + curr.calories, 0);
  const totalProtein = foodLogs.reduce((acc, curr) => acc + curr.proteinG, 0);
  const totalCarbs = foodLogs.reduce((acc, curr) => acc + curr.carbsG, 0);
  const totalFat = foodLogs.reduce((acc, curr) => acc + curr.fatG, 0);

  const displayLogs = isOverview ? foodLogs.slice(0, 3) : foodLogs;

  const handleDelete = async (id: string) => {
    if (confirm('Hapus log makanan ini?')) {
      await deleteFoodLog(id);
      if (onLogDeleted) onLogDeleted();
    }
  };

  return (
    <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Ringkasan Nutrisi Harian
            </h3>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">Asupan makronutrisi dari AI Food Scanner</p>
        </div>
        {isOverview && (
          <Link
            href="/nutrition"
            className="text-xs font-semibold text-[#FC5200] hover:text-[#E04900] flex items-center gap-0.5 transition-colors"
          >
            <span>Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Macronutrients Grid */}
      <div className="grid grid-cols-4 gap-2 text-center mb-5 tabular-nums">
        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
          <span className="text-[10px] text-zinc-400 font-mono uppercase block">Energi</span>
          <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 font-mono">
            {Math.round(totalCalories)}{' '}
            <span className="text-[10px] font-normal text-zinc-500 font-sans">kkal</span>
          </div>
        </div>
        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
          <span className="text-[10px] text-zinc-400 font-mono uppercase block">Protein</span>
          <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 font-mono">
            {Math.round(totalProtein)}g
          </div>
        </div>
        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
          <span className="text-[10px] text-zinc-400 font-mono uppercase block">Karbo</span>
          <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 font-mono">
            {Math.round(totalCarbs)}g
          </div>
        </div>
        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
          <span className="text-[10px] text-zinc-400 font-mono uppercase block">Lemak</span>
          <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 font-mono">
            {Math.round(totalFat)}g
          </div>
        </div>
      </div>

      {/* Food Log Feed */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider block">
          Riwayat Makanan {isOverview && foodLogs.length > 0 ? `(${foodLogs.length} entri)` : ''}
        </span>

        {displayLogs.length === 0 ? (
          <div className="text-center py-6 text-zinc-400 text-xs border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
            Belum ada log makanan tercatat.
          </div>
        ) : (
          displayLogs.map((food) => (
            <div
              key={food.id}
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
            >
              <div>
                <h5 className="font-semibold text-xs text-zinc-900 dark:text-zinc-200">
                  {food.foodName}
                </h5>
                <p className="text-[10px] text-zinc-400 mt-0.5">{formatDate(food.loggedAt)}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right text-xs tabular-nums">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                    {food.calories} kkal
                  </span>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    P:{food.proteinG}g C:{food.carbsG}g L:{food.fatG}g
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(food.id)}
                  className="text-zinc-400 hover:text-rose-600 p-1 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isOverview && foodLogs.length > 3 && (
        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <Link
            href="/nutrition"
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium inline-flex items-center gap-1 transition-colors"
          >
            <span>Buka semua {foodLogs.length} riwayat makanan & pagination</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#FC5200]" />
          </Link>
        </div>
      )}
    </div>
  );
}
