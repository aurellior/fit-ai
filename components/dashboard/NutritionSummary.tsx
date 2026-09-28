'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { deleteFoodLog } from '@/actions/nutrition';
import { FoodLogData } from '@/types';

interface NutritionSummaryProps {
  foodLogs: FoodLogData[];
  onLogDeleted?: () => void;
}

export default function NutritionSummary({ foodLogs, onLogDeleted }: NutritionSummaryProps) {
  const totalCalories = foodLogs.reduce((acc, curr) => acc + curr.calories, 0);
  const totalProtein = foodLogs.reduce((acc, curr) => acc + curr.proteinG, 0);
  const totalCarbs = foodLogs.reduce((acc, curr) => acc + curr.carbsG, 0);
  const totalFat = foodLogs.reduce((acc, curr) => acc + curr.fatG, 0);

  const handleDelete = async (id: string) => {
    if (confirm('Hapus log makanan ini?')) {
      await deleteFoodLog(id);
      if (onLogDeleted) onLogDeleted();
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Ringkasan Nutrisi Harian
          </h3>
          <p className="text-xs text-zinc-500">Akumulasi makronutrisi dari food scanner</p>
        </div>
      </div>

      {/* Macronutrients Grid */}
      <div className="grid grid-cols-4 gap-2 text-center mb-5 tabular-nums">
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded border border-zinc-200 dark:border-zinc-800">
          <div className="text-[10px] text-zinc-500 uppercase">Energi</div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
            {Math.round(totalCalories)} <span className="text-[10px] font-normal text-zinc-500">kkal</span>
          </div>
        </div>
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded border border-zinc-200 dark:border-zinc-800">
          <div className="text-[10px] text-zinc-500 uppercase">Protein</div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
            {Math.round(totalProtein)}g
          </div>
        </div>
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded border border-zinc-200 dark:border-zinc-800">
          <div className="text-[10px] text-zinc-500 uppercase">Karbohidrat</div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
            {Math.round(totalCarbs)}g
          </div>
        </div>
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded border border-zinc-200 dark:border-zinc-800">
          <div className="text-[10px] text-zinc-500 uppercase">Lemak</div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
            {Math.round(totalFat)}g
          </div>
        </div>
      </div>

      {/* Food Log List */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block mb-1">
          Riwayat Makanan
        </span>

        {foodLogs.length === 0 ? (
          <div className="text-center py-6 text-zinc-400 text-xs border border-dashed border-zinc-200 dark:border-zinc-800 rounded">
            Belum ada log makanan untuk hari ini.
          </div>
        ) : (
          foodLogs.map((food) => (
            <div
              key={food.id}
              className="flex items-center justify-between p-2.5 rounded bg-zinc-50/60 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800"
            >
              <div>
                <h5 className="font-medium text-xs text-zinc-900 dark:text-zinc-200">
                  {food.foodName}
                </h5>
                <p className="text-[10px] text-zinc-400">{formatDate(food.loggedAt)}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right text-xs tabular-nums">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
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
    </div>
  );
}
