'use client';

import React, { useState } from 'react';
import { DailyNutritionAuditData } from '@/types';
import { Flame, Sparkles, RefreshCw, Calendar, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';
import { getDailyNutritionAuditAction } from '@/actions/nutrition';

interface DailyNutritionAuditCardProps {
  initialAudit: DailyNutritionAuditData;
  isOverview?: boolean;
  onRefreshSuccess?: (updated: DailyNutritionAuditData) => void;
}

export default function DailyNutritionAuditCard({
  initialAudit,
  isOverview = false,
  onRefreshSuccess,
}: DailyNutritionAuditCardProps) {
  const [audit, setAudit] = useState<DailyNutritionAuditData>(initialAudit);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshAi = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await getDailyNutritionAuditAction(audit.date, true);
      setAudit(refreshed);
      if (onRefreshSuccess) onRefreshSuccess(refreshed);
    } catch (err) {
      console.error('Failed to refresh AI nutrition audit:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = (status: DailyNutritionAuditData['status']) => {
    switch (status) {
      case 'Surplus':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Surplus (+{audit.netCalories} kkal)</span>
          </span>
        );
      case 'Defisit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Defisit ({audit.netCalories} kkal)</span>
          </span>
        );
      case 'Balanced':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <Scale className="w-3.5 h-3.5" />
            <span>Balanced ({audit.netCalories > 0 ? `+${audit.netCalories}` : audit.netCalories} kkal)</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#121214] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-4 sm:p-5 shadow-xs transition-colors">
      {/* Header Strava Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800/70">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-[#FC5200] shrink-0" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Daily Nutrition Audit & Energy Balance
            </h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700/80">
              AI Sports Nutritionist
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 flex-wrap">
            <span className="flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5" />
              <span>{audit.dateFormatted}</span>
            </span>
            <span className="hidden xs:inline">•</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {audit.dayScheduleFocus}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {getStatusBadge(audit.status)}
          <button
            onClick={handleRefreshAi}
            disabled={isRefreshing}
            title="Analisis ulang dengan Gemini AI"
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#FC5200]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Energy Balance: Kalori Masuk vs Keluar */}
      <div className="py-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="text-zinc-400 font-mono text-[11px] uppercase tracking-wide">
              Kalori Masuk (Food Intake)
            </span>
            <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
              {audit.caloriesIn.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-sans font-normal text-zinc-500">kkal</span>
            </div>
            <span className="text-[11px] text-zinc-400">
              {audit.foodCount} hidangan tercatat
            </span>
          </div>

          <div className="text-right space-y-0.5">
            <span className="text-zinc-400 font-mono text-[11px] uppercase tracking-wide">
              Kalori Keluar (Latihan + BMR)
            </span>
            <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
              {audit.caloriesOut.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-sans font-normal text-zinc-500">kkal</span>
            </div>
            <span className="text-[11px] text-zinc-400">
              Latihan: {audit.activityCalories} kkal • BMR: {audit.bmrCalories} kkal
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                audit.status === 'Surplus'
                  ? 'bg-emerald-500'
                  : audit.status === 'Defisit'
                  ? 'bg-amber-500'
                  : 'bg-[#FC5200]'
              }`}
              style={{ width: `${Math.min(audit.calorieProgressPercent, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
            <span>0 kkal</span>
            <span className="text-zinc-500 font-sans">
              Rasio Pemenuhan: <strong className="font-mono text-zinc-700 dark:text-zinc-300">{audit.calorieProgressPercent}%</strong>
            </span>
            <span>Target: {audit.caloriesOut} kkal</span>
          </div>
        </div>
      </div>

      {/* Makronutrisi Breakdown (Clean tabular grid) */}
      <div className="pt-2 pb-4">
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">
          Komposisi Makronutrisi Harian
        </span>
        <div className="grid grid-cols-3 gap-2 tabular-nums">
          {/* Protein */}
          <div className="p-3 bg-zinc-50/70 dark:bg-zinc-900/50 rounded-lg border border-zinc-200/70 dark:border-zinc-800/70">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">Protein</span>
              <span className="text-[10px] font-mono text-zinc-400">
                {audit.proteinProgressPercent}%
              </span>
            </div>
            <div className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-1">
              {audit.totalProtein}g{' '}
              <span className="text-[10px] font-normal text-zinc-400 font-sans">
                / {audit.targetProteinG}g
              </span>
            </div>
            <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min(audit.proteinProgressPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Karbohidrat */}
          <div className="p-3 bg-zinc-50/70 dark:bg-zinc-900/50 rounded-lg border border-zinc-200/70 dark:border-zinc-800/70">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">Karbohidrat</span>
              <span className="text-[10px] font-mono text-zinc-400">Glikogen</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-1">
              {audit.totalCarbs}g
            </div>
            <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${Math.min(Math.round((audit.totalCarbs / 300) * 100), 100)}%` }}
              />
            </div>
          </div>

          {/* Lemak */}
          <div className="p-3 bg-zinc-50/70 dark:bg-zinc-900/50 rounded-lg border border-zinc-200/70 dark:border-zinc-800/70">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">Lemak</span>
              <span className="text-[10px] font-mono text-zinc-400">Lipid</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-1">
              {audit.totalFat}g
            </div>
            <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-rose-400 rounded-full"
                style={{ width: `${Math.min(Math.round((audit.totalFat / 80) * 100), 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Sports Nutritionist Evaluation Box (Clean, No-Slop) */}
      <div className="mt-1 p-3.5 bg-zinc-50 dark:bg-zinc-900/80 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
          <Sparkles className="w-3.5 h-3.5 text-[#FC5200]" />
          <span>Evaluasi Nutrisi & Pemulihan (Sports Nutritionist)</span>
        </div>

        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {audit.evaluationMessage}
        </p>

        <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-start gap-2 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
          <span className="text-zinc-600 dark:text-zinc-400">
            <strong className="text-zinc-800 dark:text-zinc-200">Protein Recovery:</strong> {audit.proteinStatus}
          </span>
        </div>

        {audit.actionableTip && (
          <div className="pt-1.5 flex items-start gap-2 text-xs text-[#FC5200] dark:text-[#FF7733]">
            <Flame className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="font-medium">{audit.actionableTip}</span>
          </div>
        )}
      </div>
    </div>
  );
}
