'use client';

import React, { useState } from 'react';
import { DailyNutritionAuditData } from '@/types';
import {
  Flame,
  Sparkles,
  RefreshCw,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Footprints,
  ShieldCheck,
  Zap,
  Check,
  Info,
} from 'lucide-react';
import { getDailyNutritionAuditAction, logDailyStepsAction } from '@/actions/nutrition';

interface DailyNutritionAuditCardProps {
  initialAudit: DailyNutritionAuditData;
  isOverview?: boolean;
  onRefreshSuccess?: (updated: DailyNutritionAuditData) => void;
}

export default function DailyNutritionAuditCard({
  initialAudit,
  onRefreshSuccess,
}: DailyNutritionAuditCardProps) {
  const [prevDate, setPrevDate] = useState(initialAudit.date);
  const [audit, setAudit] = useState<DailyNutritionAuditData>(initialAudit);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State untuk input langkah harian (Daily Steps)
  const [stepInputValue, setStepInputValue] = useState<string>(
    initialAudit.totalDailySteps && initialAudit.totalDailySteps > 0
      ? String(initialAudit.totalDailySteps)
      : ''
  );
  const [isSavingSteps, setIsSavingSteps] = useState(false);
  const [saveStepSuccess, setSaveStepSuccess] = useState(false);
  const [showStepForm, setShowStepForm] = useState(false);

  // Sync state cleanly when prop targetDate changes (e.g. from history pill select)
  if (prevDate !== initialAudit.date) {
    setPrevDate(initialAudit.date);
    setAudit(initialAudit);
    setStepInputValue(
      initialAudit.totalDailySteps && initialAudit.totalDailySteps > 0
        ? String(initialAudit.totalDailySteps)
        : ''
    );
  }

  const handleRefreshAi = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await getDailyNutritionAuditAction(audit.date, true);
      setAudit(refreshed);
      setStepInputValue(
        refreshed.totalDailySteps && refreshed.totalDailySteps > 0
          ? String(refreshed.totalDailySteps)
          : ''
      );
      if (onRefreshSuccess) onRefreshSuccess(refreshed);
    } catch (err) {
      console.error('Failed to refresh AI nutrition audit:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveSteps = async (stepsToSave?: number) => {
    const rawVal = stepsToSave !== undefined ? stepsToSave : parseInt(stepInputValue, 10);
    if (isNaN(rawVal) || rawVal < 0) return;

    setIsSavingSteps(true);
    try {
      await logDailyStepsAction({
        dateStr: audit.date,
        stepCount: rawVal,
        source: 'MANUAL',
      });

      // Refetch current day's audit with updated step deduction
      const refreshed = await getDailyNutritionAuditAction(audit.date, false);
      setAudit(refreshed);
      setStepInputValue(rawVal > 0 ? String(rawVal) : '');
      setSaveStepSuccess(true);
      setTimeout(() => setSaveStepSuccess(false), 3000);

      if (onRefreshSuccess) onRefreshSuccess(refreshed);
    } catch (err) {
      console.error('Failed to save daily steps:', err);
    } finally {
      setIsSavingSteps(false);
    }
  };

  const handleQuickAddSteps = (added: number) => {
    const current = parseInt(stepInputValue, 10) || 0;
    const nextVal = current + added;
    setStepInputValue(String(nextVal));
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
    <div className="bg-white dark:bg-[#121214] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-4 sm:p-5 shadow-xs transition-colors space-y-4">
      {/* 1. Header Strava Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/70">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FC5200] shrink-0" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Daily Sports Nutrition Audit & Energy Balance
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

      {/* 2. Ringkasan Total Kalori Masuk vs Keluar */}
      <div className="space-y-3">
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
              Kalori Keluar (Latihan + NEAT + BMR)
            </span>
            <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
              {audit.caloriesOut.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-sans font-normal text-zinc-500">kkal</span>
            </div>
            <span className="text-[11px] text-zinc-400">
              Latihan: {audit.activityCalories} kkal • NEAT: {audit.neatCalories} kkal • BMR: {audit.bmrCalories} kkal
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
              Rasio Keseimbangan: <strong className="font-mono text-zinc-700 dark:text-zinc-300">{audit.calorieProgressPercent}%</strong>
            </span>
            <span>Kebutuhan: {audit.caloriesOut} kkal</span>
          </div>
        </div>
      </div>

      {/* 3. Komponen Pengeluaran Energi & Transparansi Anti-Double Counting (Strava vs NEAT) */}
      <div className="p-3.5 sm:p-4 bg-zinc-50/80 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#FC5200] shrink-0" />
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-900 dark:text-zinc-100">
              Komposisi Pengeluaran Energi & Proteksi Duplikasi
            </h4>
          </div>

          {/* Anti-Double Counting Shield Badge */}
          {audit.doubleCountingPrevented ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/80">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Anti-Double Counting: Hemat {audit.deduplicatedCaloriesSaved} kkal</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-200/60 dark:bg-zinc-800/60">
              <Info className="w-3 h-3" />
              <span>Pemisahan Strava & NEAT Aktif</span>
            </span>
          )}
        </div>

        {/* 3 Pillars Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Pillar 1: Sesi Latihan Strava / Olahraga */}
          <div className="p-3 bg-white dark:bg-[#18181B] rounded-lg border border-zinc-200/70 dark:border-zinc-800/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#FC5200] flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                <span>Latihan Terstruktur</span>
              </span>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/50 text-[#FC5200] border border-orange-200 dark:border-orange-900/50">
                Strava / Gym
              </span>
            </div>
            <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
              {audit.activityCalories}{' '}
              <span className="text-xs font-normal text-zinc-500 font-sans">kkal</span>
            </div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 space-y-0.5 pt-0.5">
              <div>
                Terserap: <strong className="font-mono text-zinc-700 dark:text-zinc-300">~{audit.workoutStepsAbsorbed.toLocaleString('id-ID')}</strong> langkah
              </div>
              {audit.stravaActivitiesSummary && audit.stravaActivitiesSummary.length > 0 ? (
                <div className="truncate text-zinc-600 dark:text-zinc-400" title={audit.stravaActivitiesSummary.map(a => `${a.title} (${a.calories} kkal)`).join(', ')}>
                  {audit.stravaActivitiesSummary.map((a) => a.title).join(', ')}
                </div>
              ) : (
                <div className="italic text-zinc-400">Tidak ada sesi tercatat</div>
              )}
            </div>
          </div>

          {/* Pillar 2: Aktivitas Harian (Langkah NEAT Murni) */}
          <div className="p-3 bg-white dark:bg-[#18181B] rounded-lg border border-zinc-200/70 dark:border-zinc-800/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Footprints className="w-3.5 h-3.5" />
                <span>Langkah NEAT Murni</span>
              </span>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                Aktivitas Harian
              </span>
            </div>
            <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
              +{audit.neatCalories}{' '}
              <span className="text-xs font-normal text-zinc-500 font-sans">kkal</span>
            </div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 space-y-0.5 pt-0.5">
              <div>
                NEAT Luar Latihan: <strong className="font-mono text-zinc-700 dark:text-zinc-300">{audit.pureNeatSteps.toLocaleString('id-ID')}</strong> langkah
              </div>
              <div className="text-zinc-400">
                Total Pedometer: {audit.totalDailySteps.toLocaleString('id-ID')} langkah
              </div>
            </div>
          </div>

          {/* Pillar 3: Basal Metabolic Rate (BMR) */}
          <div className="p-3 bg-white dark:bg-[#18181B] rounded-lg border border-zinc-200/70 dark:border-zinc-800/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-zinc-400" />
                <span>Metabolisme Basal</span>
              </span>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                BMR
              </span>
            </div>
            <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
              {audit.bmrCalories}{' '}
              <span className="text-xs font-normal text-zinc-500 font-sans">kkal</span>
            </div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5">
              Kalori hidup dasar (24 kkal/kg/hari) untuk pemeliharaan organ & basal seluler.
            </div>
          </div>
        </div>

        {/* Input Langkah Harian Ala Strava (Interactive Widget) */}
        <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowStepForm((prev) => !prev)}
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-[#FC5200] dark:hover:text-[#FC5200] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Footprints className="w-3.5 h-3.5 text-[#FC5200]" />
              <span>
                {audit.hasStepsLogged
                  ? `Update Langkah Harian (${audit.totalDailySteps.toLocaleString('id-ID')} langkah)`
                  : 'Catat Langkah Harian (Daily Steps)'}
              </span>
              <span className="text-[10px] text-zinc-400 font-normal">
                {showStepForm ? '▲ Tutup' : '▼ Buka'}
              </span>
            </button>

            {saveStepSuccess && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 animate-fadeIn">
                <Check className="w-3.5 h-3.5" />
                <span>Tersimpan & De-duplikasi Diterapkan</span>
              </span>
            )}
          </div>

          {showStepForm && (
            <div className="mt-3 p-3 bg-white dark:bg-[#18181B] rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    placeholder="Contoh: 10500"
                    value={stepInputValue}
                    onChange={(e) => setStepInputValue(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#FC5200]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-mono">
                    langkah
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQuickAddSteps(1000)}
                    className="px-2 py-1 text-[10px] font-mono rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                  >
                    +1.000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddSteps(2500)}
                    className="px-2 py-1 text-[10px] font-mono rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                  >
                    +2.500
                  </button>
                  <button
                    type="button"
                    onClick={() => setStepInputValue('0')}
                    className="px-2 py-1 text-[10px] font-mono rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-colors"
                  >
                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveSteps()}
                    disabled={isSavingSteps}
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#FC5200] hover:bg-[#E04900] text-white transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    {isSavingSteps ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    <span>Simpan</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Makronutrisi Breakdown (Clean tabular grid) */}
      <div>
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

      {/* 5. AI Sports Nutritionist Evaluation Box */}
      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/80 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
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
