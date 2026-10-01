'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  Flame,
  Zap,
  Mountain,
  HeartPulse,
  Dumbbell,
  Apple,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  SlidersHorizontal,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { AiInsightData, UserProfile } from '@/types';
import { formatDate } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import ManualActivityForm from '@/components/forms/ManualActivityForm';
import FoodScannerModal from '@/components/forms/FoodScannerModal';
import LogWeightModalForm from '@/components/forms/LogWeightModalForm';
import BottomNav from '@/components/navigation/BottomNav';
import TodayCoachDirectiveBanner from '@/components/dashboard/TodayCoachDirectiveBanner';

interface CoachClientViewProps {
  user: UserProfile | null;
  initialInsight: AiInsightData | null;
}

export default function CoachClientView({ initialInsight }: CoachClientViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [insight, setInsight] = useState<AiInsightData | null>(initialInsight);
  const [prevInitialInsight, setPrevInitialInsight] = useState<AiInsightData | null>(initialInsight);

  if (initialInsight !== prevInitialInsight) {
    setPrevInitialInsight(initialInsight);
    setInsight(initialInsight);
  }

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick Action Modals state for Mobile Bottom Navigation
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  const handleRefreshData = () => {
    startTransition(() => {
      router.refresh();
    });
  };

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
  const audit = plan?.smartSkipAudit;

  return (
    <div className="space-y-8 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dashboard</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              AI Coach Intelligence
            </h1>
            <span className="text-[11px] font-mono text-[#FC5200] bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50 px-2 py-0.5 rounded font-semibold">
              Senin • Kamis • Sabtu
            </span>
            <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200/80 dark:border-zinc-700/60">
              Smart Skip Adaptive
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Program latihan adaptif yang otomatis menyesuaikan beban saat ada hari lari yang terlewat.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="self-start sm:self-auto text-xs font-medium px-3.5 py-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 flex items-center gap-2 transition-colors disabled:opacity-50 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Mengevaluasi Ulang...' : 'Evaluasi Ulang Performa'}</span>
        </button>
      </div>

      {error && (
        <div className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-4 rounded-lg border border-rose-200 dark:border-rose-900/60 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TOP OVERVIEW BANNER: Today's AI Coach Directive */}
      <section id="today-directive">
        <TodayCoachDirectiveBanner
          coachPlan={insight?.coachPlan}
          onRescheduled={(newPlan) => {
            setInsight((prev) =>
              prev
                ? {
                    ...prev,
                    coachPlan: newPlan,
                    summary: newPlan.coachGreeting,
                  }
                : null
            );
            handleRefreshData();
          }}
          onStartWorkoutClick={() => setIsActivityModalOpen(true)}
        />
      </section>

      {/* SECTION 1: Evaluasi Kedisiplinan & Smart Skip Audit */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FC5200]"></div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Audit Kedisiplinan & Evaluasi Beban Latihan
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {audit?.hasSkippedDays ? (
              <span className="text-xs font-mono font-medium px-2.5 py-1 rounded inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Ada Sesi Terlewat • Penyesuaian Aktif</span>
              </span>
            ) : (
              <span className="text-xs font-mono font-medium px-2.5 py-1 rounded inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Jadwal On Track</span>
              </span>
            )}
          </div>
        </div>

        {/* Status Tracker 3 Hari Rutin */}
        {audit && (
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase text-zinc-500 tracking-wider block">
              Pemeriksaan Riwayat Sesi Minggu Berjalan (Database Sync)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* SENIN */}
              <div
                className={`p-3.5 rounded-lg border text-xs flex flex-col justify-between ${
                  audit.auditDetails.monday.status === 'completed'
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                    : audit.auditDetails.monday.status === 'rescheduled'
                    ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800/60 text-sky-900 dark:text-sky-200'
                    : audit.auditDetails.monday.status === 'skipped'
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                    : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs font-mono block">SENIN</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {audit.auditDetails.monday.dateLabel}
                    </span>
                  </div>
                  {audit.auditDetails.monday.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> Tuntas
                    </span>
                  ) : audit.auditDetails.monday.status === 'rescheduled' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                      <RotateCcw className="w-4 h-4" /> Dialihkan
                    </span>
                  ) : audit.auditDetails.monday.status === 'skipped' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      <XCircle className="w-4 h-4" /> Terlewat
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                      <Clock className="w-3.5 h-3.5" /> Mendatang
                    </span>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-600 dark:text-zinc-400">
                  Target: {plan?.schedule.monday.focus || 'Tempo / Speed Run'}
                </div>
              </div>

              {/* KAMIS */}
              <div
                className={`p-3.5 rounded-lg border text-xs flex flex-col justify-between ${
                  audit.auditDetails.thursday.status === 'completed'
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                    : audit.auditDetails.thursday.status === 'rescheduled'
                    ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800/60 text-sky-900 dark:text-sky-200'
                    : audit.auditDetails.thursday.status === 'skipped'
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                    : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs font-mono block">KAMIS</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {audit.auditDetails.thursday.dateLabel}
                    </span>
                  </div>
                  {audit.auditDetails.thursday.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> Tuntas
                    </span>
                  ) : audit.auditDetails.thursday.status === 'rescheduled' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                      <RotateCcw className="w-4 h-4" /> Dialihkan
                    </span>
                  ) : audit.auditDetails.thursday.status === 'skipped' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      <XCircle className="w-4 h-4" /> Terlewat
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                      <Clock className="w-3.5 h-3.5" /> Mendatang
                    </span>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-600 dark:text-zinc-400">
                  Target: {plan?.schedule.thursday.focus || 'Interval / Mid-Week Endurance'}
                </div>
              </div>

              {/* SABTU */}
              <div
                className={`p-3.5 rounded-lg border text-xs flex flex-col justify-between ${
                  audit.auditDetails.saturday.status === 'completed'
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                    : audit.auditDetails.saturday.status === 'rescheduled'
                    ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800/60 text-sky-900 dark:text-sky-200'
                    : audit.auditDetails.saturday.status === 'skipped'
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                    : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs font-mono block">SABTU</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {audit.auditDetails.saturday.dateLabel}
                    </span>
                  </div>
                  {audit.auditDetails.saturday.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> Tuntas
                    </span>
                  ) : audit.auditDetails.saturday.status === 'rescheduled' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                      <RotateCcw className="w-4 h-4" /> Dialihkan
                    </span>
                  ) : audit.auditDetails.saturday.status === 'skipped' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      <XCircle className="w-4 h-4" /> Terlewat
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                      <Clock className="w-3.5 h-3.5" /> Mendatang
                    </span>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-600 dark:text-zinc-400">
                  Target: {plan?.schedule.saturday.focus || 'Safe Progressive Long Run'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Coach Directive / Feedback */}
        <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 rounded-lg p-4 space-y-2">
          <span className="text-[10px] uppercase font-mono font-semibold text-zinc-400 block">
            Feedback Langsung Pelatih
          </span>
          <p className="text-sm sm:text-base font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed italic">
            &ldquo;{plan?.coachGreeting || insight?.summary}&rdquo;
          </p>
          {audit?.activeAdjustmentNote && (
            <p className="text-xs text-[#FC5200] dark:text-orange-400 font-medium pt-1">
              {audit.activeAdjustmentNote}
            </p>
          )}
        </div>

        <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-1">
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 block text-[11px] uppercase tracking-wider font-mono">
            Evaluasi Intensitas:
          </span>
          <p>{plan?.lastWeekAnalysis || insight?.strengths}</p>
        </div>
      </section>

      {/* SECTION 2: Target Lari 3 Hari yang Dinamis & Ter-adjust */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Program Lari Mingguan Adaptif
          </h2>
          <p className="text-xs text-zinc-500">
            Jika ada sesi yang terlewat atau dialihkan, target berikutnya telah disesuaikan secara proporsional agar tidak membebani tubuh.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* SENIN */}
          <div
            className={`bg-white dark:bg-zinc-900 border rounded-lg p-5 flex flex-col justify-between transition-colors shadow-xs ${
              plan?.schedule.monday.status === 'rescheduled'
                ? 'border-sky-400/80 dark:border-sky-500/50 ring-1 ring-sky-400/20'
                : plan?.schedule.monday.isAdjusted
                ? 'border-amber-400/60 dark:border-amber-500/40'
                : 'border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    SENIN
                  </span>
                  {plan?.schedule.monday.status === 'rescheduled' ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 font-semibold flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      Dialihkan
                    </span>
                  ) : plan?.schedule.monday.isAdjusted ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold">
                      Disesuaikan
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] font-mono text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded border border-orange-200/80 dark:border-orange-900/40 font-medium">
                  Speed & Laktat
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {plan?.schedule.monday.focus || 'Tempo / Speed Run'}
                </h3>
                <div className="mt-2 p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                  {plan?.schedule.monday.targetMetric}
                </div>
              </div>

              <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pt-1 space-y-2">
                <p>{plan?.schedule.monday.details}</p>
                {plan?.schedule.monday.adjustmentReason && (
                  <div className={`p-2 rounded text-[11px] border ${
                    plan.schedule.monday.status === 'rescheduled'
                      ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-200/60 dark:border-sky-900/40 text-sky-800 dark:text-sky-300'
                      : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
                  }`}>
                    <strong>{plan.schedule.monday.status === 'rescheduled' ? 'Penyesuaian Jadwal:' : 'Alasan Adaptif:'}</strong> {plan.schedule.monday.adjustmentReason}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Target: Kecepatan laktat terkontrol</span>
            </div>
          </div>

          {/* KAMIS */}
          <div
            className={`bg-white dark:bg-zinc-900 border rounded-lg p-5 flex flex-col justify-between transition-colors shadow-xs ${
              plan?.schedule.thursday.status === 'rescheduled'
                ? 'border-sky-400/80 dark:border-sky-500/50 ring-1 ring-sky-400/20'
                : plan?.schedule.thursday.isAdjusted
                ? 'border-amber-400/80 dark:border-amber-500/50 ring-1 ring-amber-400/20'
                : 'border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    KAMIS
                  </span>
                  {plan?.schedule.thursday.status === 'rescheduled' ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 font-semibold flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      Dialihkan
                    </span>
                  ) : plan?.schedule.thursday.isAdjusted ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold">
                      Disesuaikan
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200/80 dark:border-purple-900/40 font-medium">
                  VO2 Max Booster
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {plan?.schedule.thursday.focus || 'Interval / Mid-Week Endurance'}
                </h3>
                <div className="mt-2 p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                  {plan?.schedule.thursday.targetMetric}
                </div>
              </div>

              <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pt-1 space-y-2">
                <p>{plan?.schedule.thursday.details}</p>
                {plan?.schedule.thursday.adjustmentReason && (
                  <div className={`p-2 rounded text-[11px] border ${
                    plan.schedule.thursday.status === 'rescheduled'
                      ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-200/60 dark:border-sky-900/40 text-sky-800 dark:text-sky-300'
                      : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
                  }`}>
                    <strong>{plan.schedule.thursday.status === 'rescheduled' ? 'Penyesuaian Jadwal:' : 'Alasan Adaptif:'}</strong> {plan.schedule.thursday.adjustmentReason}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
              <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Target: Daya tahan anaerobik</span>
            </div>
          </div>

          {/* SABTU */}
          <div
            className={`bg-white dark:bg-zinc-900 border rounded-lg p-5 flex flex-col justify-between transition-colors shadow-xs ${
              plan?.schedule.saturday.status === 'rescheduled'
                ? 'border-sky-400/80 dark:border-sky-500/50 ring-1 ring-sky-400/20'
                : plan?.schedule.saturday.isAdjusted
                ? 'border-amber-400/80 dark:border-amber-500/50 ring-1 ring-amber-400/20'
                : 'border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    SABTU
                  </span>
                  {plan?.schedule.saturday.status === 'rescheduled' ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 font-semibold flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      Dialihkan
                    </span>
                  ) : plan?.schedule.saturday.isAdjusted ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold">
                      Disesuaikan
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-900/40 font-medium">
                  Zone 2 Aerobic
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {plan?.schedule.saturday.focus || 'Safe Progressive Long Run'}
                </h3>
                <div className="mt-2 p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                  {plan?.schedule.saturday.targetMetric}
                </div>
              </div>

              <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pt-1 space-y-2">
                <p>{plan?.schedule.saturday.details}</p>
                {plan?.schedule.saturday.adjustmentReason && (
                  <div className={`p-2 rounded text-[11px] border ${
                    plan.schedule.saturday.status === 'rescheduled'
                      ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-200/60 dark:border-sky-900/40 text-sky-800 dark:text-sky-300'
                      : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
                  }`}>
                    <strong>{plan.schedule.saturday.status === 'rescheduled' ? 'Penyesuaian Jadwal:' : 'Alasan Adaptif:'}</strong> {plan.schedule.saturday.adjustmentReason}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
              <Mountain className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Target: Ketahanan aerobik aman</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Catatan Pemulihan & Nutrisi Atlet */}
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
          <span>FitAI Smart Engine • Gemini API</span>
        </div>
      </section>

      {/* Quick Action Modals */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Catat Latihan Baru"
        description="Masukkan data lari manual atau repetisi sesi gym atlet Anda"
        maxWidth="lg"
      >
        <ManualActivityForm
          onSuccess={() => {
            setIsActivityModalOpen(false);
            handleRefreshData();
          }}
        />
      </Modal>

      <Modal
        isOpen={isFoodModalOpen}
        onClose={() => setIsFoodModalOpen(false)}
        title="Catat Nutrisi Makanan (AI Vision & Quick-Log)"
        description="Pindai foto makanan atau ketik menu bebas untuk estimasi makronutrisi & kalori instan dengan Gemini AI"
        maxWidth="md"
      >
        <FoodScannerModal
          isModal
          onScanSuccess={() => {
            setIsFoodModalOpen(false);
            handleRefreshData();
          }}
        />
      </Modal>

      <Modal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        title="Catat Berat Badan"
        description="Catat penimbangan berat badan untuk melacak tren massa tubuh"
        maxWidth="sm"
      >
        <LogWeightModalForm
          onSuccess={() => {
            setIsWeightModalOpen(false);
            handleRefreshData();
          }}
        />
      </Modal>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        onOpenActivityModal={() => setIsActivityModalOpen(true)}
        onOpenFoodModal={() => setIsFoodModalOpen(true)}
        onOpenWeightModal={() => setIsWeightModalOpen(true)}
      />
    </div>
  );
}
