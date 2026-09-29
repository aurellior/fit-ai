'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  ArrowRight,
  Flame,
  Calendar,
  AlertCircle,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { AiInsightData } from '@/types';

interface WeeklyAiInsightProps {
  initialInsight?: AiInsightData | null;
}

export default function WeeklyAiInsight({ initialInsight }: WeeklyAiInsightProps) {
  const [insight, setInsight] = useState<AiInsightData | null>(initialInsight || null);
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

  return (
    <div id="insights" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 sm:p-6 transition-all shadow-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
              <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse"></span>
              <span>AI Coach Directive</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200/80 dark:border-zinc-700/60">
              Sen • Kam • Sab
            </span>
            {plan?.intensityVerdict && (
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-medium ${
                  plan.intensityVerdict.includes('Kurang')
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50'
                    : plan.intensityVerdict.includes('Pas')
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50'
                }`}
              >
                {plan.intensityVerdict}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Program lari mingguan adaptif berbasis riwayat Strava & latihan beban Anda
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="text-xs font-medium px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Perbarui arahan pelatih"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Menganalisis...' : 'Perbarui Arahan'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded border border-rose-200 dark:border-rose-900/60 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {insight ? (
        <div className="mt-5 space-y-4">
          {/* Coach Sapaan / Evaluasi Langsung */}
          <div className="p-4 rounded-lg bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-500">
                Pesan Pelatih
              </span>
            </div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
              &ldquo;{plan?.coachGreeting || insight.summary}&rdquo;
            </p>
          </div>

          {/* Sesi Lari Terdekat Directive Box */}
          {nextWorkout ? (
            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-orange-500/30 dark:border-orange-500/20 shadow-xs relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-orange-600 text-white">
                      {nextWorkout.dayName} • {nextWorkout.label}
                    </span>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {nextWorkout.focus}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {nextWorkout.summary}
                  </p>
                </div>

                <div className="sm:text-right shrink-0 bg-zinc-50 dark:bg-zinc-800/80 px-3 py-2 rounded border border-zinc-100 dark:border-zinc-700/60">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">
                    Target Menu
                  </span>
                  <span className="text-xs font-semibold font-mono text-orange-600 dark:text-orange-400">
                    {nextWorkout.targetMetric}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                Jadwal Lari Rutin
              </h4>
              <p className="text-xs text-zinc-500">
                Senin (Speed/Tempo), Kamis (Interval/Endurance), dan Sabtu (Long Run).
              </p>
            </div>
          )}

          {/* Bottom Actions & Last Updated */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-zinc-100 dark:border-zinc-800/60">
            <span className="text-zinc-500 text-[11px] font-mono">
              Terakhir dievaluasi: {formatDate(insight.createdAt)}
            </span>

            <Link
              href="/coach"
              className="inline-flex items-center gap-1.5 font-medium text-xs text-zinc-900 dark:text-zinc-100 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
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
