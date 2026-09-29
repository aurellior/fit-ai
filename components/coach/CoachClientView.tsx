'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Flame,
  Zap,
  Mountain,
  HeartPulse,
  Dumbbell,
  Apple,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { AiInsightData, UserProfile } from '@/types';
import { formatDate } from '@/lib/utils';

interface CoachClientViewProps {
  user: UserProfile | null;
  initialInsight: AiInsightData | null;
}

export default function CoachClientView({ user, initialInsight }: CoachClientViewProps) {
  const [insight, setInsight] = useState<AiInsightData | null>(initialInsight);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/insights', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal merefresh arahan coach');
      }
      setInsight(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const plan = insight?.coachPlan;

  return (
    <div className="space-y-8 pb-20">
      {/* Top Breadcrumb & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              FitAI Pro Coach Directive
            </h1>
            <span className="text-[11px] font-mono text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50 px-2 py-0.5 rounded font-medium">
              Senin • Kamis • Sabtu
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Program lari adaptif dan pembagian intensitas berbasis riwayat Strava & beban gym {user?.name || 'Atlet'}.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="self-start sm:self-auto text-xs font-medium px-3.5 py-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 flex items-center gap-2 transition-colors disabled:opacity-50 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Menganalisis Data...' : 'Evaluasi Ulang Performa'}</span>
        </button>
      </div>

      {error && (
        <div className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-4 rounded-lg border border-rose-200 dark:border-rose-900/60 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Coach Greeting & Evaluasi Minggu Lalu */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-600"></div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Evaluasi Performa Terakhir
            </h2>
          </div>

          {plan?.intensityVerdict && (
            <span
              className={`text-xs font-mono font-medium px-2.5 py-1 rounded inline-flex items-center gap-1.5 ${
                plan.intensityVerdict.includes('Kurang')
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50'
                  : plan.intensityVerdict.includes('Pas')
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {plan.intensityVerdict}
            </span>
          )}
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 rounded-lg p-4">
          <span className="text-[10px] uppercase font-mono font-semibold text-zinc-400 block mb-1">
            Pesan Pembuka Pelatih
          </span>
          <p className="text-sm sm:text-base font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed italic">
            &ldquo;{plan?.coachGreeting || insight?.summary}&rdquo;
          </p>
        </div>

        <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-1">
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 block text-[11px] uppercase tracking-wider">
            Catatan Evaluasi Detail:
          </span>
          <p>{plan?.lastWeekAnalysis || insight?.strengths}</p>
        </div>
      </section>

      {/* Target Minggu Ini (3 Hari Tetap) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Target Lari Minggu Ini (3 Hari Rutin)
            </h2>
            <p className="text-xs text-zinc-500">
              Pola latihan terstruktur: Kecepatan di awal pekan, Interval di tengah pekan, dan Jarak Jauh di akhir pekan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* SENIN: Tempo / Speed Run */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                  SENIN
                </span>
                <span className="text-[10px] font-mono text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded border border-orange-200/80 dark:border-orange-900/40">
                  Speed & Laktat
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {plan?.schedule.monday.focus || 'Tempo / Speed Run'}
                </h3>
                <div className="mt-2 p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                  {plan?.schedule.monday.targetMetric || '4.5 km - 5.0 km • Pace 7:15 - 7:30/km'}
                </div>
              </div>

              <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pt-1">
                <p>{plan?.schedule.monday.details}</p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Target: Lari cepat terkontrol</span>
            </div>
          </div>

          {/* KAMIS: Interval / Endurance */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                  KAMIS
                </span>
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200/80 dark:border-purple-900/40">
                  VO2 Max Booster
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {plan?.schedule.thursday.focus || 'Interval / Mid-Week Endurance'}
                </h3>
                <div className="mt-2 p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                  {plan?.schedule.thursday.targetMetric || '5x 400m @ Pace 6:45/km (Rest 90s)'}
                </div>
              </div>

              <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pt-1">
                <p>{plan?.schedule.thursday.details}</p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
              <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Target: Daya tahan anaerobik</span>
            </div>
          </div>

          {/* SABTU: Safe Progressive Long Run */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                  SABTU
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-900/40">
                  Zone 2 Aerobic
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {plan?.schedule.saturday.focus || 'Safe Progressive Long Run'}
                </h3>
                <div className="mt-2 p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                  {plan?.schedule.saturday.targetMetric || '6.5 km - 7.0 km • Pace 8:15 - 8:40/km'}
                </div>
              </div>

              <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pt-1">
                <p>{plan?.schedule.saturday.details}</p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
              <Mountain className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Target: Pondasi aerobik aman</span>
            </div>
          </div>
        </div>
      </section>

      {/* Catatan Pemulihan & Nutrisi (Recovery & Fueling Directive) */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <HeartPulse className="w-4 h-4 text-rose-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Protokol Pemulihan & Nutrisi Atlet
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-2">
            <div className="flex items-center gap-2">
              <Apple className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Nutrisi Pra & Pasca Lari
              </h4>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {plan?.recoveryAdvice.nutrition ||
                'Konsumsi karbohidrat cepat serap 45 menit sebelum lari pagi dan cukupi hidrasi.'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-2">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Sinergi Gym vs Lari
              </h4>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {plan?.recoveryAdvice.restAndGym ||
                'Hindari sesi leg day di gym pada hari sebelum lari jauh untuk mencegah kelelahan otot.'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Target Protein Harian
              </h4>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {plan?.recoveryAdvice.proteinRecommendation ||
                'Pertahankan asupan protein harian minimal 1.6g/kg berat badan untuk perbaikan serabut otot.'}
            </p>
          </div>
        </div>

        <div className="pt-2 text-[11px] text-zinc-500 font-mono flex items-center justify-between">
          <span>Terakhir disinkronkan: {insight ? formatDate(insight.createdAt) : '-'}</span>
          <span>FitAI Coach Engine • Gemini 3.8</span>
        </div>
      </section>
    </div>
  );
}
