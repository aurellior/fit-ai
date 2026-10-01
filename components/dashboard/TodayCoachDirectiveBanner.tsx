'use client';

import React, { useState } from 'react';
import {
  Calendar,
  SlidersHorizontal,
  Clock,
  Sparkles,
  RotateCcw,
  Loader2,
  AlertTriangle,
  Umbrella,
  BatteryLow,
  ShieldAlert,
  Play,
  Flame,
  Target,
  ArrowRight,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { CoachPlanData, CoachWorkoutDay } from '@/types';
import Modal from '@/components/ui/Modal';
import { RescheduledWorkoutResult } from '@/lib/services/workout-rescheduler';
import { getWibDayIndex, getWibDayName, formatWibDateIndonesian } from '@/lib/timezone';
import { rescheduleWorkoutAction } from '@/actions/workout';
import { cn } from '@/lib/utils';

interface TodayCoachDirectiveBannerProps {
  coachPlan?: CoachPlanData | null;
  onRescheduled?: (newCoachPlan: CoachPlanData) => void;
  onStartWorkoutClick?: () => void;
  className?: string;
}

const PRESET_OBSTACLES = [
  {
    id: 'rain',
    label: 'Hujan / Cuaca Buruk',
    desc: 'Jalanan licin dan risiko basah kuyup di luar ruangan',
    icon: Umbrella,
  },
  {
    id: 'fatigue',
    label: 'Kelelahan / DOMS Ekstrem',
    desc: 'Otot belum pulih dari sesi lari/gym sebelumnya',
    icon: BatteryLow,
  },
  {
    id: 'time',
    label: 'Waktu Terbatas (Sibuk)',
    desc: 'Hanya memiliki waktu 20 - 30 menit luang hari ini',
    icon: Clock,
  },
  {
    id: 'injury',
    label: 'Nyeri Sendi / Cedera Ringan',
    desc: 'Lutut, pergelangan kaki, atau tulang kering terasa nyeri',
    icon: ShieldAlert,
  },
];

const DEFAULT_SCHEDULES: Record<
  number,
  {
    dayName: string;
    focus: string;
    targetMetric: string;
    details: string;
    badge: string;
    isKey: boolean;
  }
> = {
  1: {
    dayName: 'Senin',
    focus: 'Tempo / Speed Run (Jadwal Kunci)',
    targetMetric: '4.5 km - 5.0 km • Pace 7:15 - 7:30/km',
    details:
      '1 km pemanasan santai (Pace 8:30), 2.5 km Tempo Run terkunci di Pace 7:15-7:30/km, ditutup 1 km pendinginan jalan aktif.',
    badge: 'Jadwal Kunci Speed',
    isKey: true,
  },
  2: {
    dayName: 'Selasa',
    focus: 'Gym Hypertrophy & Cross Training',
    targetMetric: '45-60 menit Resistance Training • Fokus Core & Lower Body',
    details: 'Squats, lunges, dan calf raises untuk memperkuat stabilitas sendi saat lari, ditutup stretching dinamis.',
    badge: 'Cross-Training',
    isKey: false,
  },
  3: {
    dayName: 'Rabu',
    focus: 'Active Recovery & Easy Walk',
    targetMetric: '20-30 menit Jalan Santai / Mobilisasi Sendi',
    details: 'Menjaga aliran darah dan sirkulasi limfatik tanpa membebani detak jantung tinggi. Hidrasi optimal.',
    badge: 'Recovery',
    isKey: false,
  },
  4: {
    dayName: 'Kamis',
    focus: 'Interval VO2Max Training (Jadwal Kunci)',
    targetMetric: '5x 400m @ Pace 6:45 - 7:00/km (Rest 90s)',
    details:
      '1 km jogging ringan dinamis. 5 set lari 400m cepat dengan istirahat jalan 90 detik tiap set. Jangan duduk saat jeda rest.',
    badge: 'Jadwal Kunci VO2Max',
    isKey: true,
  },
  5: {
    dayName: 'Jumat',
    focus: 'Rest & Carb Storing',
    targetMetric: 'Istirahat Total • Asupan Karbohidrat Kompleks',
    details: 'Persiapan simpanan glikogen otot sebelum menu lari jarak jauh akhir pekan (Long Run Sabtu).',
    badge: 'Rest Day',
    isKey: false,
  },
  6: {
    dayName: 'Sabtu',
    focus: 'Progressive Long Run (Jadwal Kunci)',
    targetMetric: '6.5 km - 7.0 km • Pace 8:15 - 8:40/km',
    details:
      'Lari jarak jauh murni di Zona 2 (conversational pace). Kenaikan jarak terkontrol agar aman dari risiko cedera tulang kering.',
    badge: 'Jadwal Kunci Endurance',
    isKey: true,
  },
  0: {
    dayName: 'Minggu',
    focus: 'Post-Long Run Rest & Refuel',
    targetMetric: 'Pemulihan Pasif / Jalan Santai • Protein 1.6-2.0g/kg',
    details: 'Pemulihan serat otot, mandi air hangat, dan rehidrasi elektrolit untuk persiapan minggu baru.',
    badge: 'Recovery',
    isKey: false,
  },
};

export default function TodayCoachDirectiveBanner({
  coachPlan,
  onRescheduled,
  onStartWorkoutClick,
  className,
}: TodayCoachDirectiveBannerProps) {
  // Deteksi hari saat ini dalam zona waktu WIB
  const todayDayIndex = getWibDayIndex();
  const todayWibName = getWibDayName();
  const defaultToday = DEFAULT_SCHEDULES[todayDayIndex] || DEFAULT_SCHEDULES[1];

  // Cari apakah ada sesi terstruktur di coachPlan
  let activeWorkout: CoachWorkoutDay | null = null;
  if (coachPlan?.schedule) {
    if (todayDayIndex === 1) activeWorkout = coachPlan.schedule.monday;
    else if (todayDayIndex === 4) activeWorkout = coachPlan.schedule.thursday;
    else if (todayDayIndex === 6) activeWorkout = coachPlan.schedule.saturday;
  }

  const baseFocus = activeWorkout?.focus || defaultToday.focus;
  const baseTarget = activeWorkout?.targetMetric || defaultToday.targetMetric;
  const baseDetails = activeWorkout?.details || defaultToday.details;
  const isKeyDay = defaultToday.isKey;
  const isAdjusted = activeWorkout?.isAdjusted || false;
  const adjustmentReason = activeWorkout?.adjustmentReason || null;

  // State untuk Rescheduler Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedObstacle, setSelectedObstacle] = useState<string>(PRESET_OBSTACLES[0].label);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [rescheduledPlan, setRescheduledPlan] = useState<RescheduledWorkoutResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
  const displayBadge = rescheduledPlan ? rescheduledPlan.badge : isAdjusted ? 'Smart Adjusted' : defaultToday.badge;

  return (
    <>
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#121214] shadow-xs transition-all',
          'border-l-4 border-l-[#FC5200]',
          className
        )}
      >
        {/* Subtle Strava Background Accent Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#FC5200]/5 dark:bg-[#FC5200]/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="p-4 sm:p-6 relative z-10 space-y-4">
          {/* Top Bar: Status Hari Ini & Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">
                <span className="w-2 h-2 rounded-full bg-[#FC5200] animate-pulse shrink-0"></span>
                <span>Today&apos;s AI Coach Directive</span>
              </div>
              <span className="text-[11px] font-mono text-[#FC5200] font-semibold bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded border border-orange-200/80 dark:border-orange-900/50 shrink-0">
                {todayWibName}
              </span>

              {rescheduledPlan ? (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3 text-sky-500" />
                  <span>AI Rescheduled: {rescheduledPlan.newDayOrTime}</span>
                </span>
              ) : isAdjusted ? (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Adaptasi Sesi Terlewat</span>
                </span>
              ) : isKeyDay ? (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Sesi Kunci Wajib</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  {displayBadge}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>{formatWibDateIndonesian()} (WIB)</span>
            </div>
          </div>

          {/* Core Content: Judul Menu & Target Metrik */}
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2">
              <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
                {displayFocus}
              </h1>

              {/* Target Metric Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/50 text-xs font-mono font-semibold text-[#FC5200] dark:text-orange-400 shrink-0">
                <Target className="w-3.5 h-3.5 text-[#FC5200] shrink-0" />
                <span>{displayTarget}</span>
              </div>
            </div>

            {/* Instruksi Taktis Latihan */}
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
              {displayDetails}
            </p>
          </div>

          {/* Adaptive Notification Callout (Jika terjadi penyesuaian otomatis / kendala) */}
          {(rescheduledPlan || isAdjusted || adjustmentReason || coachPlan?.smartSkipAudit?.activeAdjustmentNote) && (
            <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <span className="font-semibold block text-[11px] uppercase tracking-wider font-mono">
                  {rescheduledPlan ? 'Solusi Penyesuaian AI Berhasil Diterapkan' : 'Catatan Penyesuaian Adaptif AI'}
                </span>
                <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {rescheduledPlan
                    ? `Menu latihan dialihkan ke ${rescheduledPlan.newDayOrTime} dengan target penyesuaian agar progres mingguan tetap terjaga tanpa risiko overtraining.`
                    : adjustmentReason || coachPlan?.smartSkipAudit?.activeAdjustmentNote}
                </p>
              </div>
            </div>
          )}

          {/* Quick Action Buttons (Thumb-friendly 44px min-height) */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              {onStartWorkoutClick ? (
                <button
                  type="button"
                  onClick={onStartWorkoutClick}
                  className="w-full sm:w-auto py-2.5 px-4 bg-[#FC5200] hover:bg-[#E04800] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer min-h-[44px] active:scale-98"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Mulai Latihan / Log Aktivitas</span>
                </button>
              ) : (
                <a
                  href="/activities"
                  className="w-full sm:w-auto py-2.5 px-4 bg-[#FC5200] hover:bg-[#E04800] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer min-h-[44px] active:scale-98"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Lihat Riwayat & Log Aktivitas</span>
                </a>
              )}

              {rescheduledPlan && (
                <button
                  type="button"
                  onClick={handleResetToOriginal}
                  className="py-2.5 px-3 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                  title="Kembalikan ke Jadwal Awal"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reset Awal</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleOpenModal}
              className="w-full sm:w-auto py-2.5 px-3.5 border border-zinc-200/90 dark:border-zinc-700/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px] active:scale-98"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#FC5200]" />
              <span>Kendala Hari Ini? (AI Reschedule)</span>
            </button>
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
              className="w-full text-base sm:text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FC5200] resize-none"
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
