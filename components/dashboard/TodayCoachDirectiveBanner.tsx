'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  SlidersHorizontal,
  Sparkles,
  RotateCcw,
  Loader2,
  AlertTriangle,
  Play,
  Target,
  CheckCircle2,
} from 'lucide-react';
import { CoachPlanData, CoachWorkoutDay } from '@/types';
import Modal from '@/components/ui/Modal';
import { RescheduledWorkoutResult } from '@/lib/services/workout-rescheduler';
import { getWibDayIndex, getWibDayName, formatWibDateIndonesian } from '@/lib/timezone';
import { rescheduleWorkoutAction } from '@/actions/workout';
import { cn } from '@/lib/utils';
import { PRESET_OBSTACLES, DEFAULT_WEEKLY_SCHEDULES } from '@/lib/constants/workout';

interface TodayCoachDirectiveBannerProps {
  coachPlan?: CoachPlanData | null;
  onRescheduled?: (newCoachPlan: CoachPlanData) => void;
  onStartWorkoutClick?: () => void;
  className?: string;
}

export default function TodayCoachDirectiveBanner({
  coachPlan,
  onRescheduled,
  onStartWorkoutClick,
  className,
}: TodayCoachDirectiveBannerProps) {
  // Deteksi hari saat ini dalam zona waktu WIB
  const todayDayIndex = getWibDayIndex();
  const todayWibName = getWibDayName();
  const defaultToday = DEFAULT_WEEKLY_SCHEDULES[todayDayIndex] || DEFAULT_WEEKLY_SCHEDULES[1];

  // Cari apakah ada sesi terstruktur di coachPlan atau arahan dinamis
  let activeWorkout: CoachWorkoutDay | null = null;
  let isRescheduledToToday = false;
  const dynamicDirective = coachPlan?.todayDynamicDirective;

  if (coachPlan?.schedule) {
    if (todayDayIndex === 1) activeWorkout = coachPlan.schedule.monday;
    else if (todayDayIndex === 4) activeWorkout = coachPlan.schedule.thursday;
    else if (todayDayIndex === 6) activeWorkout = coachPlan.schedule.saturday;

    // Jika hari ini bukan jadwal default (misal: Jumat, Selasa, Minggu), periksa apakah ada sesi yang dialihkan ke hari ini
    if (!activeWorkout || activeWorkout.status !== 'rescheduled') {
      const scheduleDays = [
        coachPlan.schedule.monday,
        coachPlan.schedule.thursday,
        coachPlan.schedule.saturday,
      ].filter(Boolean) as CoachWorkoutDay[];

      const shiftedToToday = scheduleDays.find(
        (day) =>
          day.status === 'rescheduled' &&
          (day.adjustmentReason?.toLowerCase().includes(todayWibName.toLowerCase()) ||
            coachPlan.nextWorkoutDay?.dayName.toLowerCase() === todayWibName.toLowerCase())
      );
      if (shiftedToToday) {
        activeWorkout = shiftedToToday;
        isRescheduledToToday = true;
      }
    }
  }

  // State untuk Rescheduler Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedObstacle, setSelectedObstacle] = useState<string>(PRESET_OBSTACLES[0].label);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [rescheduledPlan, setRescheduledPlan] = useState<RescheduledWorkoutResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isRescheduled = (activeWorkout?.status === 'rescheduled') || isRescheduledToToday || !!rescheduledPlan;
  const isAdjusted = activeWorkout?.isAdjusted || false;
  const adjustmentReason = activeWorkout?.adjustmentReason || null;

  const baseFocus = dynamicDirective ? dynamicDirective.focus : (activeWorkout?.focus || defaultToday.focus);
  const baseTarget = dynamicDirective ? dynamicDirective.targetMetric : (activeWorkout?.targetMetric || defaultToday.targetMetric);
  const baseDetails = dynamicDirective ? dynamicDirective.details : (activeWorkout?.details || defaultToday.details);
  const isKeyDay = defaultToday.isKey;

  // Body Scroll Lock saat modal dibuka di iOS/Mobile
  React.useEffect(() => {
    if (isModalOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isModalOpen]);

  const handleOpenModal = () => {
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleExecuteReschedule = async () => {
    setIsRescheduling(true);
    setErrorMsg(null);

    try {
      const res = await rescheduleWorkoutAction({
        dayName: defaultToday.dayName,
        originalFocus: baseFocus,
        originalTarget: baseTarget,
        obstacleType: selectedObstacle,
        customNotes: customNotes.trim() || undefined,
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || 'Gagal mereschedule latihan');
      }

      setRescheduledPlan(res.data);
      if (res.coachPlan && onRescheduled) {
        onRescheduled(res.coachPlan);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan koneksi AI';
      setErrorMsg(msg);
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleResetToOriginal = () => {
    setRescheduledPlan(null);
  };

  // Nilai aktif setelah penyesuaian kendala
  const displayFocus = rescheduledPlan ? rescheduledPlan.newFocus : baseFocus;
  const displayTarget = rescheduledPlan ? rescheduledPlan.newTargetMetric : baseTarget;
  const displayDetails = rescheduledPlan ? rescheduledPlan.coachAdvice : baseDetails;
  const displayBadge = rescheduledPlan
    ? rescheduledPlan.badge
    : isRescheduled
    ? (activeWorkout?.adjustmentReason ? activeWorkout.adjustmentReason.split(':')[0] : 'AI Rescheduled')
    : dynamicDirective?.badge
    ? dynamicDirective.badge
    : isAdjusted
    ? 'Smart Adjusted'
    : defaultToday.badge;

  return (
    <>
      <div
        className={cn(
          'relative overflow-hidden rounded-3xl bg-[#0c0c10] dark:bg-[#111116] text-white border border-zinc-800/90 shadow-xl transition-all',
          className
        )}
      >
        {/* Ambient athletic gradient glow */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#FC5200]/15 dark:bg-[#FC5200]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="p-4 sm:p-5 relative z-10 space-y-4">
          {/* 1. Profile / Greeting Row (Inspired by "Sara Wilson" top section) */}
          <div className="flex items-center justify-between gap-2.5 pb-3.5 border-b border-white/10 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FC5200] to-orange-400 flex items-center justify-center text-white font-black text-sm shadow-md">
                  FP
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0c0c10]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-zinc-300 truncate">Halo, Atlet</span>
                  <span className="text-[9px] font-mono font-bold text-[#FC5200] bg-orange-500/15 border border-orange-500/30 px-1.5 py-0.2 rounded uppercase shrink-0">
                    PRO
                  </span>
                </div>
                <h2 className="text-sm font-bold text-white tracking-tight truncate">FitPulse Intelligence</h2>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="px-2 sm:px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-mono text-zinc-300 flex items-center gap-1 shrink-0">
                <Calendar className="w-3 h-3 text-[#FC5200] shrink-0" />
                <span className="truncate max-w-[120px]">{todayWibName}, {formatWibDateIndonesian().split(',')[0]}</span>
              </div>
            </div>
          </div>

          {/* 2. Today's Directive Focus & Target ("Your Next Appointment" structure) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase font-mono tracking-wider text-orange-400 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#FC5200] animate-pulse shrink-0"></span>
                <span className="truncate">Sesi Hari Ini • Next Workout</span>
              </div>

              {isRescheduled ? (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1 shrink-0">
                  <RotateCcw className="w-3 h-3 text-sky-400" />
                  <span>AI Rescheduled</span>
                </span>
              ) : dynamicDirective?.badge === 'Tuntas Hari Ini' ? (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Sesi Tuntas Hari Ini</span>
                </span>
              ) : isAdjusted || dynamicDirective?.badge?.toLowerCase().includes('adaptive') ? (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                  <SlidersHorizontal className="w-3 h-3 text-amber-400" />
                  <span>{displayBadge}</span>
                </span>
              ) : isKeyDay ? (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Sesi Kunci Wajib</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-medium bg-white/10 text-zinc-300 border border-white/10 shrink-0">
                  {displayBadge}
                </span>
              )}
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug break-words">
                  {displayFocus}
                </h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs font-mono font-bold text-[#FC5200] bg-orange-500/15 border border-orange-500/30 px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs max-w-full">
                    <Target className="w-3.5 h-3.5 text-[#FC5200] shrink-0" />
                    <span className="break-words">{displayTarget}</span>
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                    Target Utama
                  </span>
                </div>
              </div>
            </div>

            {/* Tactical Drill Instructions - Clean Bullet / Sentence */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 font-sans leading-relaxed break-words">
              <span className="font-semibold text-white mr-1.5 font-mono text-[11px] uppercase tracking-wide">
                • Arahan:
              </span>
              <span>{displayDetails}</span>
            </div>

            {/* Adaptive Notification Callout (Jika terjadi penyesuaian otomatis / kendala / cross-training) */}
            {(isRescheduled || isAdjusted || adjustmentReason || coachPlan?.smartSkipAudit?.crossTrainingNotice || coachPlan?.smartSkipAudit?.activeAdjustmentNote) && (
              <div className={cn(
                "p-2.5 rounded-xl border text-xs flex items-center gap-2",
                isRescheduled
                  ? "bg-sky-500/15 border-sky-500/30 text-sky-200"
                  : coachPlan?.smartSkipAudit?.crossTrainingNotice
                  ? "bg-purple-500/15 border-purple-500/30 text-purple-200"
                  : "bg-amber-500/15 border-amber-500/30 text-amber-200"
              )}>
                {isRescheduled ? (
                  <RotateCcw className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                ) : coachPlan?.smartSkipAudit?.crossTrainingNotice ? (
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <div className="min-w-0 flex-1 truncate">
                  <span className="font-semibold font-mono text-[10px] uppercase tracking-wide mr-1">
                    {isRescheduled
                      ? 'Adaptasi Selesai:'
                      : coachPlan?.smartSkipAudit?.crossTrainingNotice
                      ? 'Proteksi Otot:'
                      : 'Catatan AI:'}
                  </span>
                  <span className="text-[11px]">
                    {rescheduledPlan
                      ? `${rescheduledPlan.badge} (${rescheduledPlan.newDayOrTime})`
                      : activeWorkout?.adjustmentReason
                      ? activeWorkout.adjustmentReason
                      : coachPlan?.smartSkipAudit?.crossTrainingNotice
                      ? coachPlan.smartSkipAudit.crossTrainingNotice
                      : coachPlan?.smartSkipAudit?.activeAdjustmentNote || 'Target latihan disesuaikan otomatis.'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Action Buttons Row (Thumb-Friendly) */}
          <div className="pt-1 flex items-center gap-2">
            {onStartWorkoutClick ? (
              <button
                type="button"
                onClick={onStartWorkoutClick}
                className="flex-1 py-2.5 px-4 bg-[#FC5200] hover:bg-[#E04800] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 cursor-pointer min-h-[44px] active:scale-98"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Mulai Sesi Sekarang</span>
              </button>
            ) : (
              <Link
                href="/activities"
                className="flex-1 py-2.5 px-4 bg-[#FC5200] hover:bg-[#E04800] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 cursor-pointer min-h-[44px] active:scale-98"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Mulai Sesi</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleOpenModal}
              className="py-2.5 px-3.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px] active:scale-98 shrink-0"
              title="Atur ulang jadwal jika ada kendala"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-300" />
              <span className="hidden min-[380px]:inline">Atur Jadwal</span>
            </button>

            {rescheduledPlan && (
              <button
                type="button"
                onClick={handleResetToOriginal}
                className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer min-h-[44px] shrink-0"
                title="Kembalikan ke Jadwal Awal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: AI WORKOUT RESCHEDULER */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isRescheduling && setIsModalOpen(false)}
        title="AI Workout Rescheduler & Adaptasi Taktis"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Header Info */}
          <div className="p-3 rounded-lg bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/40 text-xs">
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FC5200]" />
              <span>Jadwal Asli Hari Ini ({defaultToday.dayName}):</span>
            </div>
            <div className="text-zinc-600 dark:text-zinc-400 mt-1">
              <strong>{baseFocus}</strong> • {baseTarget}
            </div>
          </div>

          {/* Pilihan Kendala Cepat */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              Pilih Kendala yang Anda Alami Hari Ini:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_OBSTACLES.map((obs) => {
                const IconComponent = obs.icon;
                const isSelected = selectedObstacle === obs.label;
                return (
                  <button
                    key={obs.id}
                    type="button"
                    onClick={() => setSelectedObstacle(obs.label)}
                    disabled={isRescheduling}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-orange-50/80 dark:bg-orange-950/40 border-[#FC5200] text-zinc-900 dark:text-zinc-100 ring-1 ring-[#FC5200]'
                        : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <IconComponent
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        isSelected ? 'text-[#FC5200]' : 'text-zinc-400'
                      }`}
                    />
                    <div>
                      <div className="text-xs font-semibold">{obs.label}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                        {obs.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catatan Tambahan Bebas */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Catatan Kondisi / Waktu Spesifik (Opsional):
            </label>
            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Contoh: Sedang sedikit demam ringan, atau hanya punya waktu 20 menit sebelum meeting..."
              disabled={isRescheduling}
              className="w-full text-base sm:text-sm p-3 min-h-[68px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FC5200] focus:border-[#FC5200] transition-colors resize-none"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleExecuteReschedule}
              disabled={isRescheduling}
              className="flex-1 py-2.5 px-4 bg-[#FC5200] hover:bg-[#E04800] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm cursor-pointer min-h-[44px] active:scale-98"
            >
              {isRescheduling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menganalisis Adaptasi dengan AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dapatkan Solusi Adaptif AI</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isRescheduling}
              className="py-2.5 px-3.5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium transition-colors cursor-pointer min-h-[44px]"
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
