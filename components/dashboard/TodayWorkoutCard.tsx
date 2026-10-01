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
} from 'lucide-react';
import { CoachPlanData, CoachWorkoutDay } from '@/types';
import Modal from '@/components/ui/Modal';
import { RescheduledWorkoutResult } from '@/lib/services/workout-rescheduler';

interface TodayWorkoutCardProps {
  coachPlan?: CoachPlanData | null;
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
    label: 'Waktu Terbatas / Lembur',
    desc: 'Hanya memiliki waktu luang 20-30 menit hari ini',
    icon: Clock,
  },
  {
    id: 'injury',
    label: 'Nyeri Sendi / Lutut / Engkel',
    desc: 'Perlu protokol perlindungan benturan & pencegahan cedera',
    icon: ShieldAlert,
  },
];

const DEFAULT_SCHEDULES: Record<number, { dayName: string; focus: string; targetMetric: string; details: string; badge: string; isKey: boolean }> = {
  1: {
    dayName: 'Senin',
    focus: 'Tempo / Speed Run',
    targetMetric: '4.5 km - 5.0 km • Pace 7:15 - 7:30/km',
    details: '1 km pemanasan santai, 2.5 km Tempo Run terkunci di zona laktat, ditutup 1 km pendinginan jalan aktif.',
    badge: 'Tempo Run',
    isKey: true,
  },
  2: {
    dayName: 'Selasa',
    focus: 'Active Recovery & Mobility',
    targetMetric: '20-30 menit Jalan Santai / Peregangan Dinamis',
    details: 'Sirkulasi darah ringan untuk meluruhkan asam laktat pasca lari tempo tanpa memberi beban kardio berlebih.',
    badge: 'Recovery',
    isKey: false,
  },
  3: {
    dayName: 'Rabu',
    focus: 'Upper Body & Core Stability',
    targetMetric: '30-45 menit Latihan Beban Bagian Atas & Inti',
    details: 'Fokus stabilitas postural tanpa membebani otot paha dan betis sebelum sesi interval besok.',
    badge: 'Strength',
    isKey: false,
  },
  4: {
    dayName: 'Kamis',
    focus: 'Interval VO2Max / Mid-Week Speed',
    targetMetric: '5x 400m @ Pace 6:45 - 7:00/km (Rest 90s)',
    details: '1 km jogging ringan dinamis. 5 set lari 400m cepat dengan jeda istirahat jalan 90 detik tiap set.',
    badge: 'Interval',
    isKey: true,
  },
  5: {
    dayName: 'Jumat',
    focus: 'Rest Pre-Long Run & Glycogen Load',
    targetMetric: 'Istirahat Total • Hidrasi Optimal & Karbohidrat Kompleks',
    details: 'Pencegahan benturan dan pengisian glikogen hati dan otot jelang lari panjang akhir pekan.',
    badge: 'Rest Day',
    isKey: false,
  },
  6: {
    dayName: 'Sabtu',
    focus: 'Safe Progressive Long Run',
    targetMetric: '6.5 km - 7.0 km • Pace 8:15 - 8:40/km (Zona 2)',
    details: 'Lari jarak jauh murni di Zona 2 (conversational pace). Kenaikan volume terukur untuk ketahanan aerobik.',
    badge: 'Long Run',
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

export default function TodayWorkoutCard({ coachPlan }: TodayWorkoutCardProps) {
  // Deteksi hari saat ini
  const todayDayIndex = new Date().getDay();
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

  // State untuk Rescheduler
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedObstacle, setSelectedObstacle] = useState<string>(PRESET_OBSTACLES[0].label);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [rescheduledPlan, setRescheduledPlan] = useState<RescheduledWorkoutResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenModal = () => {
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleExecuteReschedule = async () => {
    setIsRescheduling(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai/workout-rescheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayName: defaultToday.dayName,
          originalFocus: baseFocus,
          originalTarget: baseTarget,
          obstacleType: selectedObstacle,
          customNotes: customNotes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mereschedule latihan');
      }

      setRescheduledPlan(json.data);
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

  return (
    <>
      <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5 shadow-xs relative overflow-hidden transition-all">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FC5200] via-orange-400 to-amber-500" />

        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FC5200]/10 flex items-center justify-center text-[#FC5200] shrink-0">
              <Calendar className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Menu Latihan Hari Ini
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#FC5200]/10 text-[#FC5200] font-bold">
                  {defaultToday.dayName}
                </span>
                {rescheduledPlan ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1 font-medium">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{rescheduledPlan.badge}</span>
                  </span>
                ) : isKeyDay ? (
                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    Sesi Lari Kunci
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                    Pemulihan Aktif
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {rescheduledPlan
                  ? 'Jadwal telah diadaptasi oleh Gemini AI sesuai kendala atlet'
                  : 'Rencana sesi adaptif berbasis jadwal mingguan & histori Strava'}
              </p>
            </div>
          </div>

          {/* Quick Reschedule Action Trigger */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
            {rescheduledPlan ? (
              <button
                type="button"
                onClick={handleResetToOriginal}
                className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center gap-1 transition-colors cursor-pointer"
                title="Kembalikan ke jadwal asli"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Jadwal Asli</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenModal}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/50 dark:hover:bg-orange-900/60 text-[#FC5200] border border-orange-200 dark:border-orange-900/60 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Kendala Hari Ini? (Reschedule)</span>
              </button>
            )}
          </div>
        </div>

        {/* Workout Content Display */}
        <div className="pt-3.5 space-y-3">
          {rescheduledPlan ? (
            /* Tampilan Modifikasi AI Rescheduler */
            <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-2.5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-800 dark:text-amber-400 block">
                    Menu Pengganti Direkomendasikan
                  </span>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {rescheduledPlan.newFocus}
                  </h4>
                </div>
                <div className="sm:text-right shrink-0 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/60">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase block">
                    Target Metrik Baru
                  </span>
                  <span className="text-xs font-bold font-mono text-[#FC5200]">
                    {rescheduledPlan.newTargetMetric}
                  </span>
                </div>
              </div>

              <div className="pt-1 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed border-t border-amber-200/50 dark:border-amber-900/40">
                <span className="font-semibold text-amber-900 dark:text-amber-300 mr-1.5 font-mono text-[11px]">
                  💡 Arahan Pelatih AI:
                </span>
                {rescheduledPlan.coachAdvice}
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-1">
                <span>Waktu Pelaksanaan: <strong className="text-zinc-700 dark:text-zinc-300">{rescheduledPlan.newDayOrTime}</strong></span>
                <span className="text-amber-700 dark:text-amber-400">Kendala: {rescheduledPlan.obstacleType}</span>
              </div>
            </div>
          ) : (
            /* Tampilan Menu Jadwal Rutin Normal */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {baseFocus}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                    {defaultToday.badge}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                  {baseDetails}
                </p>
              </div>

              <div className="sm:text-right shrink-0 bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200/70 dark:border-zinc-800/80">
                <span className="text-[10px] uppercase font-mono text-zinc-400 block">
                  Target Sesi
                </span>
                <span className="text-xs font-bold font-mono text-[#FC5200]">
                  {baseTarget}
                </span>
              </div>
            </div>
          )}

          {/* Quick tips & Strava status */}
          <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 font-mono">
            <span>
              {isKeyDay
                ? '⚡ Sinkronkan Strava pasca latihan untuk pencatatan otomatis'
                : '🧘 Utamakan mobilitas sendi & pemenuhan nutrisi protein'}
            </span>
            <span className="hidden sm:inline text-zinc-500">
              FitAI Adaptive Engine
            </span>
          </div>
        </div>
      </div>

      {/* Modal Reschedule dengan Body Scroll Lock */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isRescheduling && setIsModalOpen(false)}
        title="AI Workout Rescheduler"
        description={`Konsultasikan kendala latihan hari ${defaultToday.dayName} untuk solusi pengganti adaptif`}
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          {/* Sesi Asli yang Terdampak */}
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 text-xs">
            <span className="text-[10px] uppercase font-mono text-zinc-400 block">
              Sesi Latihan Asli:
            </span>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {baseFocus} • <span className="font-mono text-[#FC5200]">{baseTarget}</span>
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
              className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FC5200] resize-none"
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
              className="flex-1 py-2.5 px-4 bg-[#FC5200] hover:bg-[#E04800] text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
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
              className="py-2.5 px-3.5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
