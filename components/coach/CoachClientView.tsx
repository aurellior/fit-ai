'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  SlidersHorizontal,
  Play,
  RotateCcw,
  FastForward,
  Activity,
  Flame,
  Gauge,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { AiInsightData, UserProfile, ActivityData, CoachWorkoutDay } from '@/types';
import Modal from '@/components/ui/Modal';
import ManualActivityForm from '@/components/forms/ManualActivityForm';
import FoodScannerModal from '@/components/forms/FoodScannerModal';
import LogWeightModalForm from '@/components/forms/LogWeightModalForm';
import BottomNav from '@/components/navigation/BottomNav';
import { advanceWorkoutQueueAction, rescheduleWorkoutAction } from '@/actions/workout';
import { PRESET_OBSTACLES } from '@/lib/constants/workout';
import { cn } from '@/lib/utils';

interface CoachClientViewProps {
  user: UserProfile | null;
  initialInsight: AiInsightData | null;
  activities?: ActivityData[];
}

export default function CoachClientView({
  initialInsight,
  activities = [],
}: CoachClientViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [insight, setInsight] = useState<AiInsightData | null>(initialInsight);
  const [prevInitialInsight, setPrevInitialInsight] = useState<AiInsightData | null>(initialInsight);

  if (initialInsight !== prevInitialInsight) {
    setPrevInitialInsight(initialInsight);
    setInsight(initialInsight);
  }

  const [isLoading, setIsLoading] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Quick Action Modals state for Mobile Bottom Navigation
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  // Rescheduler Modal State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedObstacle, setSelectedObstacle] = useState<string>(PRESET_OBSTACLES[0].label);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  const plan = insight?.coachPlan;

  // Sesi aktif saat ini
  const activeWorkout: CoachWorkoutDay = plan?.activeWorkout || {
    dayName: 'Next Workout',
    focus: plan?.nextWorkoutDay?.focus || 'Tempo / Speed Run',
    targetMetric: plan?.nextWorkoutDay?.targetMetric || '5.0 km • Pace 7:15 - 7:30/km',
    details: plan?.nextWorkoutDay?.summary || '1 km pemanasan santai (Pace 8:30) + 3 km tempo stabil + 1 km jalan aktif.',
    intensityBadge: plan?.nextWorkoutDay?.label || 'Tempo Run',
    status: 'upcoming',
  };

  // Antrean sesi ke depan
  const upcomingQueue: CoachWorkoutDay[] = plan?.upcomingQueue || [
    {
      dayName: 'Menu Selanjutnya (+1)',
      focus: 'Interval VO2Max Training',
      targetMetric: '5x 400m @ Pace 6:45 - 7:00/km (Rest 90s)',
      details: '1 km jogging ringan, 5 set interval cepat dengan jeda 90 detik, pendinginan 1 km.',
      intensityBadge: 'Peak VO2Max',
      status: 'upcoming',
    },
    {
      dayName: 'Menu Selanjutnya (+2)',
      focus: 'Progressive Long Run',
      targetMetric: '7.0 km • Pace 8:15 - 8:40/km',
      details: 'Lari jarak jauh murni di Zona 2 (conversational pace). Jaga hidrasi optimal.',
      intensityBadge: 'Aerobic Endurance',
      status: 'upcoming',
    },
  ];

  // Hitung performa 7 hari terakhir secara langsung
  const now = new Date();
  const sevenDaysAgoTime = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const recentActivities = activities.filter(
    (a) => new Date(a.startTime).getTime() >= sevenDaysAgoTime
  );
  const recentRuns = recentActivities.filter((a) => a.type === 'RUN');
  const total7DayMeters = recentRuns.reduce((acc, a) => acc + (a.distanceMeters || 0), 0);
  const total7DayKm = (total7DayMeters / 1000).toFixed(1);
  const total7DayRunsCount = recentRuns.length;

  const validPaces = recentRuns.filter((a) => a.avgPaceSecPerKm && a.avgPaceSecPerKm > 0);
  const avgPaceSec =
    validPaces.length > 0
      ? Math.round(
          validPaces.reduce((acc, a) => acc + (a.avgPaceSecPerKm || 0), 0) / validPaces.length
        )
      : 0;
  const avgPaceFormatted =
    avgPaceSec > 0
      ? `${Math.floor(avgPaceSec / 60)}'${(avgPaceSec % 60).toString().padStart(2, '0')}"/km`
      : '7\'20"/km';

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    setActionMessage(null);
    try {
      const res = await fetch('/api/ai/insights', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengevaluasi antrean latihan');
      }
      setInsight(json.data);
      setActionMessage('Antrean latihan berhasil disinkronkan!');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan koneksi';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdvanceQueue = async (actionType: 'complete' | 'skip') => {
    setIsAdvancing(true);
    setError(null);
    setActionMessage(null);
    try {
      const res = await advanceWorkoutQueueAction({ action: actionType });
      if (!res.success) {
        throw new Error(res.error || 'Gagal memajukan sesi latihan');
      }
      if (res.coachPlan) {
        setInsight((prev) =>
          prev
            ? {
                ...prev,
                coachPlan: res.coachPlan,
              }
            : null
        );
      }
      setActionMessage(
        actionType === 'complete'
          ? 'Sesi ditandai tuntas! Antrean bergulir ke menu berikutnya.'
          : 'Sesi dilewati. Menu berikutnya siap dieksekusi.'
      );
      setTimeout(() => setActionMessage(null), 3500);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      setError(msg);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    setIsSubmittingReschedule(true);
    setError(null);
    try {
      const res = await rescheduleWorkoutAction({
        dayName: 'Next Workout',
        originalFocus: activeWorkout.focus,
        originalTarget: activeWorkout.targetMetric,
        obstacleType: selectedObstacle,
        customNotes,
      });

      if (!res.success) {
        throw new Error(res.error || 'Gagal menyesuaikan kendala latihan');
      }

      if (res.coachPlan) {
        setInsight((prev) =>
          prev
            ? {
                ...prev,
                coachPlan: res.coachPlan,
              }
            : null
        );
      }
      setIsRescheduleModalOpen(false);
      setActionMessage('Latihan berhasil diadaptasi oleh AI Coach!');
      setTimeout(() => setActionMessage(null), 3500);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses penyesuaian';
      setError(msg);
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto">
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
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">AI Coach</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase font-mono">
              AI Coach Intelligence
            </h1>
            <span className="text-[10px] font-mono text-[#FC5200] bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 px-2 py-0.5 rounded-full font-bold">
              Antrean Adaptif Bebas Hari
            </span>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading || isAdvancing}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#FC5200] hover:bg-[#E04900] text-white flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-xs cursor-pointer active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isLoading ? 'Mengevaluasi...' : 'Sync AI'}</span>
        </button>
      </div>

      {/* Notifications */}
      {actionMessage && (
        <div className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {error && (
        <div className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* HERO SECTION: NEXT WORKOUT (Kartu Fokus Utama) */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0e0e12] via-[#121217] to-[#1a1714] text-white border border-zinc-800 shadow-xl p-4 sm:p-6 space-y-4">
        {/* Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-60 h-60 bg-[#FC5200]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FC5200] animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-wider text-orange-400 uppercase">
                Next Up • Sesi Siap Eksekusi
              </span>
            </div>

            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10">
              {activeWorkout.intensityBadge || 'Jadwal Aktif'}
            </span>
          </div>

          {/* Core Target Display (Besar & Kontras) */}
          <div className="space-y-1.5">
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{activeWorkout.focus}</span>
            </h2>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FC5200]/20 border border-[#FC5200]/40 text-[#FC5200] font-mono font-bold text-sm sm:text-base">
              <Activity className="w-4 h-4" />
              <span>{activeWorkout.targetMetric}</span>
            </div>
          </div>

          {/* Tactical Instruction (1-2 baris padat) */}
          <div className="text-xs sm:text-sm text-zinc-300 bg-white/5 border border-white/5 rounded-xl p-3 leading-relaxed">
            <p className="font-sans">
              <strong className="text-white font-mono text-[11px] uppercase tracking-wider block mb-0.5">
                Instruksi Pelatih:
              </strong>
              • {activeWorkout.details}
            </p>
          </div>

          {/* Adaptive Note Badge (Jika ada kelelahan/leg day) */}
          {activeWorkout.adjustmentReason && (
            <div className="text-[11px] text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-lg p-2.5 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{activeWorkout.adjustmentReason}</span>
            </div>
          )}

          {/* Action Button Strip */}
          <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsActivityModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#FC5200] hover:bg-[#E04900] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Mulai / Catat Lari</span>
            </button>

            <button
              onClick={() => handleAdvanceQueue('complete')}
              disabled={isAdvancing}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Tandai latihan ini sudah selesai dan gulir ke sesi berikutnya"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tandai Selesai</span>
            </button>

            <button
              onClick={() => handleAdvanceQueue('skip')}
              disabled={isAdvancing}
              className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Lewati sesi ini ke menu berikutnya"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Lewati Sesi</span>
            </button>

            <button
              onClick={() => setIsRescheduleModalOpen(true)}
              className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ml-auto"
              title="Sesuaikan latihan karena hujan, capek, atau sibuk"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
              <span>Ada Kendala?</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: ANTREAN 2 SESI BERIKUTNYA (UPCOMING QUEUE) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#FC5200]" />
            <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase font-mono tracking-tight">
              Antrean Sesi Selanjutnya
            </h2>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            2 Menu ke Depan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {upcomingQueue.map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    Menu Antrean +{idx + 1}
                  </span>
                  <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/40 text-[#FC5200] border border-orange-200/80 dark:border-orange-900/40 uppercase">
                    {item.intensityBadge || 'Jadwal'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {item.focus}
                </h3>

                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                  • {item.details}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-zinc-400 font-semibold">
                  Target:
                </span>
                <span className="text-xs font-mono font-bold text-[#FC5200]">
                  {item.targetMetric}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: RINGKASAN PERFORMA 7 HARI TERAKHIR (ROLLING 7-DAY PERFORMANCE STRIP) */}
      <section className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-[#FC5200]" />
            <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase font-mono tracking-tight">
              Overview 7 Hari Terakhir
            </h2>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            Rolling Window Aktif
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-100 dark:border-zinc-800">
            <span className="text-[9px] uppercase font-mono text-zinc-400 block mb-0.5">
              Jarak Total
            </span>
            <span className="text-base sm:text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
              {total7DayKm}{' '}
              <span className="text-[10px] font-sans font-normal text-zinc-500">km</span>
            </span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-100 dark:border-zinc-800">
            <span className="text-[9px] uppercase font-mono text-zinc-400 block mb-0.5">
              Sesi Lari
            </span>
            <span className="text-base sm:text-xl font-bold font-mono text-[#FC5200]">
              {total7DayRunsCount}{' '}
              <span className="text-[10px] font-sans font-normal text-zinc-500">sesi</span>
            </span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-100 dark:border-zinc-800">
            <span className="text-[9px] uppercase font-mono text-zinc-400 block mb-0.5">
              Rata-rata Pace
            </span>
            <span className="text-xs sm:text-base font-bold font-mono text-zinc-900 dark:text-zinc-100">
              {avgPaceFormatted}
            </span>
          </div>
        </div>
      </section>

      {/* AI RESCHEDULER MODAL (Penyesuaian Kendala Cepat) */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Penyesuaian Sesi Adaptif AI"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Pilih kendala hari ini. AI Coach akan mereformulasi menu lari berikutnya agar Anda tetap aman dan berkembang.
          </p>

          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase font-bold text-zinc-500 block">
              Pilih Kendala:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_OBSTACLES.map((obs) => {
                const Icon = obs.icon;
                const isSelected = selectedObstacle === obs.label;
                return (
                  <button
                    key={obs.id}
                    type="button"
                    onClick={() => setSelectedObstacle(obs.label)}
                    className={cn(
                      'p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer',
                      isSelected
                        ? 'border-[#FC5200] bg-orange-50/60 dark:bg-orange-950/30'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 mt-0.5',
                        isSelected ? 'text-[#FC5200]' : 'text-zinc-500'
                      )}
                    />
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {obs.label}
                      </div>
                      <div className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                        {obs.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase font-bold text-zinc-500 block">
              Catatan Tambahan (Opsional):
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Contoh: Lutut kanan agak ngilu saat ditekuk..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#FC5200]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsRescheduleModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleRescheduleSubmit}
              disabled={isSubmittingReschedule}
              className="px-4 py-2 rounded-lg bg-[#FC5200] hover:bg-[#E04900] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmittingReschedule ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menghitung...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Adaptasi Sesi Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Manual Activity Log Modal */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Catat Aktivitas Olahraga"
      >
        <ManualActivityForm
          isModal
          onSuccess={() => {
            setIsActivityModalOpen(false);
            handleAdvanceQueue('complete');
          }}
        />
      </Modal>

      {/* Quick Modals for Food & Weight */}
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
            startTransition(() => router.refresh());
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
            startTransition(() => router.refresh());
          }}
        />
      </Modal>

      {/* Mobile Sticky Bottom Navigation */}
      <BottomNav
        onOpenActivityModal={() => setIsActivityModalOpen(true)}
        onOpenFoodModal={() => setIsFoodModalOpen(true)}
        onOpenWeightModal={() => setIsWeightModalOpen(true)}
      />
    </div>
  );
}
