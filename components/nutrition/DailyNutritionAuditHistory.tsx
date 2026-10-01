'use client';

import React, { useState } from 'react';
import { DailyNutritionAuditData } from '@/types';
import { Calendar, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';
import DailyNutritionAuditCard from './DailyNutritionAuditCard';

interface DailyNutritionAuditHistoryProps {
  initialHistory: DailyNutritionAuditData[];
}

export default function DailyNutritionAuditHistory({
  initialHistory,
}: DailyNutritionAuditHistoryProps) {
  const [history, setHistory] = useState<DailyNutritionAuditData[]>(initialHistory);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const selectedAudit = history[selectedIndex] || history[0];

  const handleUpdateAudit = (updated: DailyNutritionAuditData) => {
    setHistory((prev) =>
      prev.map((item, idx) => (idx === selectedIndex ? updated : item))
    );
  };

  return (
    <div className="space-y-4">
      {/* Active Detailed Audit Card */}
      {selectedAudit && (
        <DailyNutritionAuditCard
          key={selectedAudit.date}
          initialAudit={selectedAudit}
          onRefreshSuccess={handleUpdateAudit}
        />
      )}

      {/* 7-Day History Pills / List */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-mono">
              Riwayat Audit Energi 7 Hari Terakhir
            </h4>
          </div>
          <span className="text-[11px] text-zinc-400 font-sans">
            Klik hari untuk melihat rincian & evaluasi AI
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {history.map((dayAudit, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={dayAudit.date}
                onClick={() => setSelectedIndex(idx)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#FC5200] bg-orange-50/30 dark:bg-orange-950/20 ring-1 ring-[#FC5200]/30'
                    : 'border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500 mb-1">
                  <span>{dayAudit.dayName}</span>
                  {dayAudit.status === 'Surplus' ? (
                    <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  ) : dayAudit.status === 'Defisit' ? (
                    <ArrowDownRight className="w-3 h-3 text-amber-500" />
                  ) : (
                    <Scale className="w-3 h-3 text-zinc-400" />
                  )}
                </div>

                <div className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {dayAudit.caloriesIn > 0 ? `${dayAudit.caloriesIn} kkal` : '0 kkal'}
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mt-1 pt-1 border-t border-zinc-200/40 dark:border-zinc-800/40">
                  <span>Net:</span>
                  <span
                    className={
                      dayAudit.netCalories > 150
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : dayAudit.netCalories < -250
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }
                  >
                    {dayAudit.netCalories > 0 ? `+${dayAudit.netCalories}` : dayAudit.netCalories}
                  </span>
                </div>

                {dayAudit.totalDailySteps > 0 && (
                  <div className="flex items-center justify-between text-[9px] text-zinc-400 font-mono mt-0.5">
                    <span>Langkah:</span>
                    <span className="flex items-center gap-0.5 text-zinc-500 dark:text-zinc-300">
                      {dayAudit.doubleCountingPrevented && <span title="Anti-Double Counting aktif">🛡️</span>}
                      {dayAudit.totalDailySteps >= 1000
                        ? `${(dayAudit.totalDailySteps / 1000).toFixed(1)}k`
                        : dayAudit.totalDailySteps}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
