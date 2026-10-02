'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { AiInsightData } from '@/types';

interface WeeklyAiInsightProps {
  initialInsight?: AiInsightData | null;
}

export default function WeeklyAiInsight({ initialInsight }: WeeklyAiInsightProps) {
  const [insight, setInsight] = useState<AiInsightData | null>(initialInsight || null);
  const [prevInitialInsight, setPrevInitialInsight] = useState<AiInsightData | null>(initialInsight || null);

  if (initialInsight !== prevInitialInsight) {
    setPrevInitialInsight(initialInsight || null);
    setInsight(initialInsight || null);
  }

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/insights', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memperbarui arahan pelatih AI');
      }
      setInsight(json.data);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kegagalan sistem';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const plan = insight?.coachPlan;
  const nextWorkout = plan?.nextWorkoutDay;
  const audit = plan?.smartSkipAudit;

  return (
    <div
      id="insights"
      className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5 transition-all shadow-xs"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-xs tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">
            <span className="w-2 h-2 rounded-full bg-[#FC5200] animate-pulse"></span>
            <span>AI Coach Directive</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200/60 dark:border-zinc-700/60">
            {audit
              ? `${audit.auditDetails.monday.dayName?.slice(0, 3) || 'Sen'} • ${audit.auditDetails.thursday.dayName?.slice(0, 3) || 'Kam'} • ${audit.auditDetails.saturday.dayName?.slice(0, 3) || 'Sab'}`
              : 'Sen • Kam • Sab'}
          </span>
          {audit?.hasSkippedDays || audit?.auditDetails.monday.isShifted || audit?.auditDetails.thursday.isShifted || audit?.auditDetails.saturday.isShifted ? (
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" />
              <span>Adaptif</span>
            </span>
          ) : (
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>On Track</span>
            </span>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="text-xs font-semibold p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
          title="Perbarui arahan pelatih"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#FC5200]' : ''}`} />
          <span className="hidden sm:inline">{isLoading ? 'Menganalisis...' : 'Sync'}</span>
        </button>
      </div>

      {error && (
        <div className="mt-3 text-xs text-rose-700 dark:rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/60 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {insight ? (
        <div className="mt-3 space-y-3">
          {/* Smart Skip Notification Banner (Jika ada hari terlewat) */}
          {audit?.activeAdjustmentNote && (
            <div className="p-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="truncate min-w-0">
                <span className="font-semibold font-mono text-[10px] uppercase mr-1">Penyesuaian:</span>
                <span className="text-[11px]">{audit.activeAdjustmentNote}</span>
              </div>
            </div>
          )}

          {/* Sapaan Pelatih - 1 punchy sentence */}
          <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-[#18181b] border border-zinc-100 dark:border-zinc-800">
            <span className="text-[9px] uppercase font-mono font-bold text-zinc-400 block mb-1 tracking-wider">
              Status Atlet
            </span>
            <p className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-snug italic">
              &ldquo;{plan?.coachGreeting || insight.summary}&rdquo;
            </p>
          </div>

          {/* Sesi Lari Terdekat Directive Box (Responsif mobile/iPhone 15 tanpa terpotong) */}
          {nextWorkout && (
            <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-orange-500/30 dark:border-orange-500/25 shadow-2xs relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-[#FC5200] text-white shrink-0">
                      {nextWorkout.dayName}
                    </span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 break-words">
                      {nextWorkout.focus}
                    </span>
                    {nextWorkout.adjustmentBadge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold shrink-0">
                        {nextWorkout.adjustmentBadge}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 break-words leading-relaxed">
                    • {nextWorkout.summary}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 bg-orange-50/80 dark:bg-orange-950/40 px-3 py-1.5 rounded-lg border border-orange-200/80 dark:border-orange-900/60 shrink-0">
                  <span className="text-[9px] uppercase font-mono text-zinc-500 dark:text-zinc-400 font-semibold shrink-0">
                    Target
                  </span>
                  <span className="text-xs font-mono font-bold text-[#FC5200] break-words text-right">
                    {nextWorkout.targetMetric}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mini Track Record Minggu Berjalan (Adaptif & Dinamis) */}
          {audit && (
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mb-2">
                <span>STATUS KEPATUHAN JADWAL MINGGU INI</span>
                <span>3 Sesi Wajib</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {/* Slot 1: Senin (Default) / Adaptif */}
                <div
                  className={`p-2.5 rounded border text-xs flex flex-col justify-between ${
                    audit.auditDetails.monday.status === 'completed'
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                      : audit.auditDetails.monday.status === 'rescheduled'
                      ? 'bg-sky-50/70 dark:bg-sky-950/20 border-sky-300 dark:border-sky-800/60 text-sky-900 dark:text-sky-200'
                      : audit.auditDetails.monday.status === 'skipped'
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                      : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[11px] font-mono uppercase block">
                        {audit.auditDetails.monday.dayName || 'SENIN'}
                      </span>
                      {audit.auditDetails.monday.isShifted && (
                        <span className="text-[8px] font-mono text-amber-600 dark:text-amber-400 block -mt-0.5">
                          Def: {audit.auditDetails.monday.defaultDayName?.slice(0, 3) || 'Sen'}
                        </span>
                      )}
                    </div>
                    {audit.auditDetails.monday.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : audit.auditDetails.monday.status === 'rescheduled' ? (
                      <RotateCcw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                    ) : audit.auditDetails.monday.status === 'skipped' ? (
                      <XCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 capitalize truncate">
                    {audit.auditDetails.monday.status === 'completed'
                      ? 'Tuntas'
                      : audit.auditDetails.monday.status === 'rescheduled'
                      ? 'Dialihkan'
                      : audit.auditDetails.monday.status === 'skipped'
                      ? 'Terlewat'
                      : 'Mendatang'}
                  </div>
                </div>

                {/* Slot 2: Kamis (Default) / Adaptif */}
                <div
                  className={`p-2.5 rounded border text-xs flex flex-col justify-between ${
                    audit.auditDetails.thursday.status === 'completed'
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                      : audit.auditDetails.thursday.status === 'rescheduled'
                      ? 'bg-sky-50/70 dark:bg-sky-950/20 border-sky-300 dark:border-sky-800/60 text-sky-900 dark:text-sky-200'
                      : audit.auditDetails.thursday.status === 'skipped'
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                      : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[11px] font-mono uppercase block">
                        {audit.auditDetails.thursday.dayName || 'KAMIS'}
                      </span>
                      {audit.auditDetails.thursday.isShifted && (
                        <span className="text-[8px] font-mono text-amber-600 dark:text-amber-400 block -mt-0.5">
                          Def: {audit.auditDetails.thursday.defaultDayName?.slice(0, 3) || 'Kam'}
                        </span>
                      )}
                    </div>
                    {audit.auditDetails.thursday.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : audit.auditDetails.thursday.status === 'rescheduled' ? (
                      <RotateCcw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                    ) : audit.auditDetails.thursday.status === 'skipped' ? (
                      <XCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 capitalize truncate">
                    {audit.auditDetails.thursday.status === 'completed'
                      ? 'Tuntas'
                      : audit.auditDetails.thursday.status === 'rescheduled'
                      ? 'Dialihkan'
                      : audit.auditDetails.thursday.status === 'skipped'
                      ? 'Terlewat'
                      : 'Mendatang'}
                  </div>
                </div>

                {/* Slot 3: Sabtu (Default) / Adaptif */}
                <div
                  className={`p-2.5 rounded border text-xs flex flex-col justify-between ${
                    audit.auditDetails.saturday.status === 'completed'
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                      : audit.auditDetails.saturday.status === 'rescheduled'
                      ? 'bg-sky-50/70 dark:bg-sky-950/20 border-sky-300 dark:border-sky-800/60 text-sky-900 dark:text-sky-200'
                      : audit.auditDetails.saturday.status === 'skipped'
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                      : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[11px] font-mono uppercase block">
                        {audit.auditDetails.saturday.dayName || 'SABTU'}
                      </span>
                      {audit.auditDetails.saturday.isShifted && (
                        <span className="text-[8px] font-mono text-amber-600 dark:text-amber-400 block -mt-0.5">
                          Def: {audit.auditDetails.saturday.defaultDayName?.slice(0, 3) || 'Sab'}
                        </span>
                      )}
                    </div>
                    {audit.auditDetails.saturday.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : audit.auditDetails.saturday.status === 'rescheduled' ? (
                      <RotateCcw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                    ) : audit.auditDetails.saturday.status === 'skipped' ? (
                      <XCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 capitalize truncate">
                    {audit.auditDetails.saturday.status === 'completed'
                      ? 'Tuntas'
                      : audit.auditDetails.saturday.status === 'rescheduled'
                      ? 'Dialihkan'
                      : audit.auditDetails.saturday.status === 'skipped'
                      ? 'Terlewat'
                      : 'Mendatang'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Actions & Last Updated */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-zinc-100 dark:border-zinc-800/60">
            <span className="text-zinc-500 text-[11px] font-mono">
              Terakhir dievaluasi: {formatDate(insight.createdAt)}
            </span>

            <Link
              href="/ai-coach"
              className="inline-flex items-center gap-1.5 font-semibold text-xs text-zinc-900 dark:text-zinc-100 hover:text-[#FC5200] dark:hover:text-orange-400 transition-colors"
            >
              <span>Buka AI Coach Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 py-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-md">
          <p className="text-xs text-zinc-500">
            Belum ada evaluasi tersimpan untuk periode ini.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="mt-3 text-xs font-medium px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-md transition-colors"
          >
            Minta Evaluasi Pelatih Sekarang
          </button>
        </div>
      )}
    </div>
  );
}
