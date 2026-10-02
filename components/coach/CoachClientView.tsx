'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
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
    <div className="space-y-4 pb-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-1">
            <Link
              href="/"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Overview</span>
            </Link>
            <span>/</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Coach</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase font-mono">
              AI Coach Intelligence
            </h1>
            <span className="text-[9px] font-mono text-[#FC5200] bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 px-1.5 py-0.5 rounded font-bold">
              {audit
                ? `${audit.auditDetails.monday.dayName?.slice(0, 3) || 'Sen'} • ${audit.auditDetails.thursday.dayName?.slice(0, 3) || 'Kam'} • ${audit.auditDetails.saturday.dayName?.slice(0, 3) || 'Sab'}`
                : 'Sen • Kam • Sab'}
            </span>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#FC5200] hover:bg-[#E04900] text-white flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs cursor-pointer active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isLoading ? 'Mengevaluasi...' : 'Evaluasi'}</span>
        </button>
      </div>

      {error && (
        <div className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-lg border border-rose-200 dark:border-rose-900/60 flex items-center gap-2">
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
      <section className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#FC5200]"></div>
            <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase font-mono tracking-tight">
              Audit Jadwal & Kedisiplinan
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
              {/* Slot 1: Senin (Default) / Adaptif */}
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs font-mono uppercase block">
                        {audit.auditDetails.monday.dayName || 'SENIN'}
                      </span>
                      {audit.auditDetails.monday.isShifted && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                          Def: {audit.auditDetails.monday.defaultDayName || 'Senin'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">
                      {audit.auditDetails.monday.dateLabel}
                    </span>
                  </div>
                  {audit.auditDetails.monday.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> Tuntas
                    </span>
                  ) : audit.auditDetails.monday.status === 'rescheduled' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                      <RotateCcw className="w-4 h-4 shrink-0" /> Dialihkan
                    </span>
                  ) : audit.auditDetails.monday.status === 'skipped' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      <XCircle className="w-4 h-4 shrink-0" /> Terlewat
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                      <Clock className="w-3.5 h-3.5 shrink-0" /> Mendatang
                    </span>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-600 dark:text-zinc-400">
                  Target: {plan?.schedule.monday.focus || 'Tempo / Speed Run'}
                </div>
              </div>

              {/* Slot 2: Kamis (Default) / Adaptif */}
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs font-mono uppercase block">
                        {audit.auditDetails.thursday.dayName || 'KAMIS'}
                      </span>
                      {audit.auditDetails.thursday.isShifted && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                          Def: {audit.auditDetails.thursday.defaultDayName || 'Kamis'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">
                      {audit.auditDetails.thursday.dateLabel}
                    </span>
                  </div>
                  {audit.auditDetails.thursday.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> Tuntas
                    </span>
                  ) : audit.auditDetails.thursday.status === 'rescheduled' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                      <RotateCcw className="w-4 h-4 shrink-0" /> Dialihkan
                    </span>
                  ) : audit.auditDetails.thursday.status === 'skipped' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      <XCircle className="w-4 h-4 shrink-0" /> Terlewat
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                      <Clock className="w-3.5 h-3.5 shrink-0" /> Mendatang
                    </span>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-600 dark:text-zinc-400">
                  Target: {plan?.schedule.thursday.focus || 'Interval / Mid-Week Endurance'}
                </div>
              </div>

              {/* Slot 3: Sabtu (Default) / Adaptif */}
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs font-mono uppercase block">
                        {audit.auditDetails.saturday.dayName || 'SABTU'}
                      </span>
                      {audit.auditDetails.saturday.isShifted && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                          Def: {audit.auditDetails.saturday.defaultDayName || 'Sabtu'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">
                      {audit.auditDetails.saturday.dateLabel}
                    </span>
                  </div>
                  {audit.auditDetails.saturday.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> Tuntas
                    </span>
                  ) : audit.auditDetails.saturday.status === 'rescheduled' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                      <RotateCcw className="w-4 h-4 shrink-0" /> Dialihkan
                    </span>
                  ) : audit.auditDetails.saturday.status === 'skipped' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      <XCircle className="w-4 h-4 shrink-0" /> Terlewat
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                      <Clock className="w-3.5 h-3.5 shrink-0" /> Mendatang
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
        <div className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-3.5 space-y-1.5">
          <span className="text-[9px] uppercase font-mono font-bold text-zinc-400 block tracking-wider">
            Arahan Langsung Pelatih
          </span>
          <p className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-snug italic">
            &ldquo;{plan?.coachGreeting || insight?.summary}&rdquo;
          </p>
          {audit?.crossTrainingNotice && (
            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold pt-0.5">
              • {audit.crossTrainingNotice}
            </p>
          )}
          {audit?.activeAdjustmentNote && (
            <p className="text-[11px] text-[#FC5200] font-semibold pt-0.5">
              • {audit.activeAdjustmentNote}
            </p>
          )}
        </div>

        <div className="text-xs text-zinc-600 dark:text-zinc-400 p-2.5 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/30 border border-zinc-200/50 dark:border-zinc-800/50">
          <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono text-[10px] uppercase tracking-wide mr-1.5">
            Evaluasi Beban:
          </span>
          <span>{plan?.lastWeekAnalysis || insight?.strengths}</span>
        </div>
      </section>

      {/* SECTION 2: Target Lari 3 Hari yang Dinamis & Ter-adjust */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FC5200]" />
            <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase font-mono tracking-tight">
              Program Lari Mingguan Adaptif
            </h2>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            3 Sesi Kunci
          </span>
        </div>

        <div className="space-y-3">
          {/* SENIN */}
          <div
            className={`bg-white dark:bg-[#121214] border rounded-xl p-3.5 sm:p-4 transition-colors shadow-2xs ${
              plan?.schedule.monday.status === 'rescheduled'
                ? 'border-sky-400/80 dark:border-sky-500/50'
                : plan?.schedule.monday.isAdjusted
                ? 'border-amber-400/60 dark:border-amber-500/40'
                : 'border-zinc-200/80 dark:border-zinc-800/80'
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {plan?.schedule.monday.dayName?.toUpperCase() || 'SENIN'}
                  </span>
                  {plan?.schedule.monday.isShifted && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                      Def: {plan.schedule.monday.defaultDayName || 'Senin'}
                    </span>
                  )}
                  {plan?.schedule.monday.status === 'rescheduled' ? (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 font-bold flex items-center gap-1">
                      <RotateCcw className="w-2.5 h-2.5" />
                      Dialihkan
                    </span>
                  ) : plan?.schedule.monday.isAdjusted ? (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold">
                      Disesuaikan
                    </span>
                  ) : null}
                </div>
                <span className="text-[9px] font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded border border-orange-200/80 dark:border-orange-900/40 uppercase">
                  Speed & Laktat
                </span>
              </div>

              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 break-words">
                    {plan?.schedule.monday.focus || 'Tempo / Speed Run'}
                  </h3>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-orange-50/80 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900/60 text-xs font-mono font-bold text-[#FC5200] shrink-0 max-w-[130px] truncate text-center">
                  {plan?.schedule.monday.targetMetric}
                </div>
              </div>

              <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-1 break-words">
                <p>• {plan?.schedule.monday.details}</p>
                {plan?.schedule.monday.adjustmentReason && (
                  <div className={`p-2 rounded text-[10px] border break-words ${
                    plan.schedule.monday.status === 'rescheduled'
                      ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-200/60 dark:border-sky-900/40 text-sky-800 dark:text-sky-300'
                      : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
                  }`}>
                    <strong>Catatan:</strong> {plan.schedule.monday.adjustmentReason}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KAMIS */}
          <div
            className={`bg-white dark:bg-[#121214] border rounded-xl p-3.5 sm:p-4 transition-colors shadow-2xs ${
              plan?.schedule.thursday.status === 'rescheduled'
                ? 'border-sky-400/80 dark:border-sky-500/50'
                : plan?.schedule.thursday.isAdjusted
                ? 'border-amber-400/80 dark:border-amber-500/50'
                : 'border-zinc-200/80 dark:border-zinc-800/80'
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {plan?.schedule.thursday.dayName?.toUpperCase() || 'KAMIS'}
                  </span>
                  {plan?.schedule.thursday.isShifted && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                      Def: {plan.schedule.thursday.defaultDayName || 'Kamis'}
                    </span>
                  )}
                  {plan?.schedule.thursday.status === 'rescheduled' ? (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 font-bold flex items-center gap-1">
                      <RotateCcw className="w-2.5 h-2.5" />
                      Dialihkan
                    </span>
                  ) : plan?.schedule.thursday.isAdjusted ? (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold">
                      Disesuaikan
                    </span>
                  ) : null}
                </div>
                <span className="text-[9px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200/80 dark:border-purple-900/40 uppercase">
                  VO2 Max Booster
                </span>
              </div>

              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 break-words">
                    {plan?.schedule.thursday.focus || 'Interval / Mid-Week Endurance'}
                  </h3>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-orange-50/80 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900/60 text-xs font-mono font-bold text-[#FC5200] shrink-0 max-w-[130px] truncate text-center">
                  {plan?.schedule.thursday.targetMetric}
                </div>
              </div>

              <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-1 break-words">
                <p>• {plan?.schedule.thursday.details}</p>
                {plan?.schedule.thursday.adjustmentReason && (
                  <div className={`p-2 rounded text-[10px] border break-words ${
                    plan.schedule.thursday.status === 'rescheduled'
                      ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-200/60 dark:border-sky-900/40 text-sky-800 dark:text-sky-300'
                      : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
                  }`}>
                    <strong>Catatan:</strong> {plan.schedule.thursday.adjustmentReason}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SABTU */}
          <div
            className={`bg-white dark:bg-[#121214] border rounded-xl p-3.5 sm:p-4 transition-colors shadow-2xs ${
              plan?.schedule.saturday.status === 'rescheduled'
                ? 'border-sky-400/80 dark:border-sky-500/50'
                : plan?.schedule.saturday.isAdjusted
                ? 'border-amber-400/80 dark:border-amber-500/50'
                : 'border-zinc-200/80 dark:border-zinc-800/80'
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {plan?.schedule.saturday.dayName?.toUpperCase() || 'SABTU'}
                  </span>
                  {plan?.schedule.saturday.isShifted && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                      Def: {plan.schedule.saturday.defaultDayName || 'Sabtu'}
                    </span>
                  )}
                  {plan?.schedule.saturday.status === 'rescheduled' ? (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 font-bold flex items-center gap-1">
                      <RotateCcw className="w-2.5 h-2.5" />
                      Dialihkan
                    </span>
                  ) : plan?.schedule.saturday.isAdjusted ? (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold">
                      Disesuaikan
                    </span>
                  ) : null}
                </div>
                <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-900/40 uppercase">
                  Zone 2 Aerobic
                </span>
              </div>

              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 break-words">
                    {plan?.schedule.saturday.focus || 'Safe Progressive Long Run'}
                  </h3>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-orange-50/80 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900/60 text-xs font-mono font-bold text-[#FC5200] shrink-0 max-w-[130px] truncate text-center">
                  {plan?.schedule.saturday.targetMetric}
                </div>
              </div>

              <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-1 break-words">
                <p>• {plan?.schedule.saturday.details}</p>
                {plan?.schedule.saturday.adjustmentReason && (
                  <div className={`p-2 rounded text-[10px] border break-words ${
                    plan.schedule.saturday.status === 'rescheduled'
                      ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-200/60 dark:border-sky-900/40 text-sky-800 dark:text-sky-300'
                      : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
                  }`}>
                    <strong>Catatan:</strong> {plan.schedule.saturday.adjustmentReason}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Catatan Pemulihan & Nutrisi Atlet */}
      <section className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
          <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase font-mono tracking-tight">
            Protokol Pemulihan & Nutrisi
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-100 dark:border-zinc-800 flex items-start gap-2.5">
            <Apple className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px] block font-mono">
                Nutrisi Pra & Pasca Lari
              </span>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                • {plan?.recoveryAdvice.nutrition || 'Karbohidrat cepat serap 45 menit sebelum lari pagi dan cukupi hidrasi.'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-100 dark:border-zinc-800 flex items-start gap-2.5">
            <Dumbbell className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px] block font-mono">
                Sinergi Gym & Lari
              </span>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                • {plan?.recoveryAdvice.restAndGym || 'Hindari sesi leg day di gym 24 jam sebelum long run untuk mencegah kelelahan.'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-100 dark:border-zinc-800 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px] block font-mono">
                Target Protein Harian
              </span>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                • {plan?.recoveryAdvice.proteinRecommendation || 'Pertahankan asupan protein minimal 1.6g/kg berat badan.'}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-1 text-[10px] text-zinc-400 font-mono flex items-center justify-between">
          <span>Sync: {insight ? formatDate(insight.createdAt) : '-'}</span>
          <span>Gemini AI Engine</span>
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
        title="Catat Nutrisi (AI Vision)"
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
