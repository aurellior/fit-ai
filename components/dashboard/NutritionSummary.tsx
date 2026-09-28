'use client';

import React from 'react';
import { Utensils, Trash2, Apple } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { deleteFoodLog } from '@/actions/nutrition';

interface FoodLogItem {
  id: string;
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  loggedAt: Date | string;
}

interface NutritionSummaryProps {
  foodLogs: FoodLogItem[];
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Ringkasan Nutrisi Harian</h3>
            <p className="text-xs text-slate-500">Hasil estimasi kalori dari Food Scanner AI</p>
          </div>
        </div>
      </div>

      {/* Makronutrisi Cards */}
      <div className="grid grid-cols-4 gap-2 text-center mb-6">
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
          <div className="text-[11px] text-slate-500">Total Energi</div>
          <div className="text-base font-bold text-amber-600 dark:text-amber-400">
            {Math.round(totalCalories)} <span className="text-xs font-normal">kkal</span>
          </div>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200/50 dark:border-rose-900/30">
          <div className="text-[11px] text-slate-500">Protein</div>
          <div className="text-base font-bold text-rose-600 dark:text-rose-400">
            {Math.round(totalProtein)}g
          </div>
        </div>
        <div className="p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200/50 dark:border-sky-900/30">
          <div className="text-[11px] text-slate-500">Karbohidrat</div>
          <div className="text-base font-bold text-sky-600 dark:text-sky-400">
            {Math.round(totalCarbs)}g
          </div>
        </div>
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/50 dark:border-indigo-900/30">
          <div className="text-[11px] text-slate-500">Lemak</div>
          <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">
            {Math.round(totalFat)}g
          </div>
        </div>
      </div>

      {/* List Makanan */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Riwayat Makanan Terbaru
        </h4>

        {foodLogs.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            Belum ada foto makanan yang di-scan hari ini.
          </div>
        ) : (
          foodLogs.map((food) => (
            <div
              key={food.id}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xs text-emerald-600">
                  <Apple className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    {food.foodName}
                  </h5>
                  <p className="text-[11px] text-slate-400">{formatDate(food.loggedAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right text-xs">
                  <div className="font-bold text-amber-600 dark:text-amber-400">
                    {food.calories} kkal
                  </div>
                  <div className="text-[10px] text-slate-400">
                    P: {food.proteinG}g | C: {food.carbsG}g | F: {food.fatG}g
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(food.id)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
