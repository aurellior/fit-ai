'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StravaConnectButton from '@/components/dashboard/StravaConnectButton';
import WeeklyAiInsight from '@/components/dashboard/WeeklyAiInsight';
import ActivityList from '@/components/dashboard/ActivityList';
import NutritionSummary from '@/components/dashboard/NutritionSummary';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import Modal from '@/components/ui/Modal';
import ManualActivityForm from '@/components/forms/ManualActivityForm';
import FoodScannerModal from '@/components/forms/FoodScannerModal';
import LogWeightModalForm from '@/components/forms/LogWeightModalForm';
import BottomNav from '@/components/navigation/BottomNav';
import {
  MapPin,
  Clock,
  Flame,
  ChevronRight,
  Calendar,
  Target,
  Trophy,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  UserProfile,
  StravaTokenData,
  ActivityData,
  AiInsightData,
  FoodLogData,
  WeightLogData,
  DailyNutritionAuditData,
} from '@/types';
import { cn, formatDuration } from '@/lib/utils';
import DailyNutritionAuditCard from '@/components/nutrition/DailyNutritionAuditCard';
import DailyStepCheckInCard from '@/components/dashboard/DailyStepCheckInCard';

interface DashboardClientViewProps {
  user: UserProfile | null;
  stravaToken: StravaTokenData | null;
  initialActivities: ActivityData[];
  initialInsight: AiInsightData | null;
  initialFoodLogs: FoodLogData[];
  initialWeightLogs: WeightLogData[];
  initialNutritionAudit?: DailyNutritionAuditData;
}

export default function DashboardClientView({
  stravaToken,
  initialActivities,
  initialInsight,
  initialFoodLogs,
  initialWeightLogs,
  initialNutritionAudit,
}: DashboardClientViewProps) {
  const router = useRouter();

  // Modals state (Keeps dashboard pristine & clutter-free)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  // Dual-hierarchy view mode: 'week' (This Week - Default) | 'all' (All-Time Cumulative)
  const [viewMode, setViewMode] = useState<'week' | 'all'>('week');

  // Waktu referensi (mendukung data live & mock)
  const now = new Date();
  const latestActivityTimestamp =
    initialActivities.length > 0
      ? Math.max(...initialActivities.map((a) => new Date(a.startTime).getTime()))
      : now.getTime();

  const refTime =
    Math.abs(now.getTime() - latestActivityTimestamp) < 30 * 24 * 60 * 60 * 1000
      ? now.getTime()
      : latestActivityTimestamp;

  const refDate = new Date(refTime);
  const currentDayOfWeek = refDate.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

  // Awal minggu: Senin 00:00:00
  const startOfWeek = new Date(refDate);
  startOfWeek.setDate(refDate.getDate() + distanceToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  // Akhir minggu: Minggu 23:59:59.999
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // A. This Week Data & Metrics (Senin s/d Minggu)
  const weekActivities = initialActivities.filter((act) => {
    const actTime = new Date(act.startTime).getTime();
    return actTime >= startOfWeek.getTime() && actTime <= endOfWeek.getTime();
  });

  const weekDistanceMeters = weekActivities.reduce(
    (acc, act) => acc + (act.distanceMeters || 0),
    0
  );
  const weekDistanceKm = (weekDistanceMeters / 1000).toFixed(1);

  const weekDurationSec = weekActivities.reduce(
    (acc, act) => acc + (act.durationSec || 0),
    0
  );
  const weekDurationFormatted = formatDuration(weekDurationSec);

  const weekCalories = weekActivities.reduce(
    (acc, act) => acc + (act.calories || 0),
    0
  );

  const weekCount = weekActivities.length;

  // Weekly Goal & Progress Calculations (clean Strava style target)
  const currentWeekKmNum = Number(weekDistanceKm);
  const weeklyGoalKm = currentWeekKmNum > 25 ? Math.ceil(currentWeekKmNum / 5) * 5 + 5 : 25.0;
  const goalProgressPercent = Math.min(100, Math.round((currentWeekKmNum / weeklyGoalKm) * 100));
  const remainingKm = Math.max(0, Number((weeklyGoalKm - currentWeekKmNum).toFixed(1)));

  // Sports breakdown this week
  const runCount = weekActivities.filter((a) => a.type === 'RUN').length;
  const rideCount = weekActivities.filter((a) => a.type === 'RIDE').length;
  const gymCount = weekActivities.filter((a) => a.type === 'WEIGHT_TRAINING').length;
  const otherCount = weekActivities.length - (runCount + rideCount + gymCount);

  const breakdownParts: string[] = [];
  if (runCount > 0) breakdownParts.push(`${runCount} Lari`);
  if (rideCount > 0) breakdownParts.push(`${rideCount} Gowes`);
  if (gymCount > 0) breakdownParts.push(`${gymCount} Gym/Beban`);
  if (otherCount > 0) breakdownParts.push(`${otherCount} Lainnya`);
  const sportsBreakdown = breakdownParts.length > 0 ? breakdownParts.join(' • ') : 'Belum ada sesi';

  // B. All-Time Cumulative Data & Milestones
  const allDistanceMeters = initialActivities.reduce(
    (acc, act) => acc + (act.distanceMeters || 0),
    0
  );
  const allDistanceKm = (allDistanceMeters / 1000).toFixed(1);

  const allDurationSec = initialActivities.reduce(
    (acc, act) => acc + (act.durationSec || 0),
    0
  );
  const allDurationFormatted = formatDuration(allDurationSec);
  const allDurationHours = (allDurationSec / 3600).toFixed(1);

  const allCalories = initialActivities.reduce(
    (acc, act) => acc + (act.calories || 0),
    0
  );

  const allCount = initialActivities.length;

  const longestActivityMeters = Math.max(
    0,
    ...initialActivities.map((a) => a.distanceMeters || 0)
  );
  const longestActivityKm = (longestActivityMeters / 1000).toFixed(1);

  const latestWeight = initialWeightLogs[0]?.weightKg || 68.0;

  // Date Range label: Senin s/d Minggu
  const formatDateShort = (d: Date) =>
    d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  const weekDateRange = `${formatDateShort(startOfWeek)} - ${formatDateShort(endOfWeek)}`;

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-12">
      {/* 1. Strava Sync Action Bar */}
      <div className="flex items-center justify-end">
        <StravaConnectButton
          isConnected={!!stravaToken}
          athleteId={stravaToken?.athleteId}
          onSyncComplete={handleRefresh}
        />
      </div>

      {/* 2. Top Stats Bar: Clean Strava Dual-Hierarchy (This Week Overview & All-Time Cumulative) */}
      <section className="space-y-3.5">
        {/* Tier Header & Tab Segmen Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#FC5200] shrink-0"></span>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
              {viewMode === 'week' ? 'Ringkasan Performa Minggu Ini' : 'Pencapaian Sepanjang Waktu'}
            </h2>
            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
              {viewMode === 'week' ? `Sen – Min (${weekDateRange})` : 'Kumulatif Akun'}
            </span>
          </div>

          {/* Segmented Control Switcher (Full Width 50/50 di mobile, inline di desktop) */}
          <div className="w-full sm:w-auto grid grid-cols-2 sm:flex p-1 bg-zinc-100 dark:bg-[#18181b] rounded-lg border border-zinc-200/80 dark:border-zinc-800 text-xs font-medium min-w-0">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={cn(
                'w-full sm:w-auto px-2 sm:px-3.5 py-2 sm:py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center min-w-0',
                viewMode === 'week'
                  ? 'bg-white dark:bg-zinc-900 text-[#FC5200] font-semibold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              )}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">This Week</span>
              <span className="text-[10px] px-1 py-0.2 bg-[#FC5200]/10 text-[#FC5200] rounded font-mono font-bold shrink-0 hidden min-[360px]:inline">
                Pekan Ini
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={cn(
                'w-full sm:w-auto px-2 sm:px-3.5 py-2 sm:py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center min-w-0',
                viewMode === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-[#FC5200] font-semibold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              )}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">All-Time</span>
              <span className="text-[10px] px-1 py-0.2 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded font-mono shrink-0 hidden min-[360px]:inline">
                Kumulatif
              </span>
            </button>
          </div>
        </div>

        {/* Tier A: This Week Overview (Default) */}
        {viewMode === 'week' ? (
          <div className="space-y-3">
            {/* Weekly Target Progress Bar Banner */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FC5200]/10 flex items-center justify-center text-[#FC5200] shrink-0">
                    <Target className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Target Jarak Mingguan
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FC5200]/10 text-[#FC5200] font-semibold">
                        {goalProgressPercent}% Tercapai
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Pekan {weekDateRange} (Senin – Minggu) • Sasaran: {weeklyGoalKm.toFixed(1)} km
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5 self-end sm:self-auto font-mono">
                  <span className="text-xl sm:text-2xl font-bold text-[#FC5200] tabular-nums">
                    {weekDistanceKm}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">/ {weeklyGoalKm.toFixed(1)} km</span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full bg-zinc-100 dark:bg-zinc-800/80 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#FC5200] h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${goalProgressPercent}%` }}
                />
              </div>

              {/* Progress Details Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 text-[11px] text-zinc-500">
                <div className="flex items-center gap-1.5">
                  {remainingKm > 0 ? (
                    <span>
                      Tersisa <strong className="text-zinc-800 dark:text-zinc-200 font-mono font-semibold">{remainingKm} km</strong> lagi menuju target minggu ini
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Target mingguan terpenuhi! Pertahankan momentum Anda.
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10px] text-zinc-400 bg-zinc-50 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-800/50">
                  {sportsBreakdown}
                </div>
              </div>
            </div>

            {/* 4 Weekly KPI Cards (Total Jarak, Total Durasi, Kalori, dan Jumlah Aktivitas) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {/* Card 1: Total Jarak */}
              <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 sm:p-4 lg:p-5 relative overflow-hidden group">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold truncate">
                    Total Jarak
                  </span>
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FC5200] shrink-0" />
                </div>
                <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {weekDistanceKm}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 uppercase font-mono">km</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 sm:mt-1 truncate">
                  <span>{weekActivities.filter((a) => (a.distanceMeters || 0) > 0).length} rute lari & gowes</span>
                </div>
              </div>

              {/* Card 2: Total Durasi */}
              <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 sm:p-4 lg:p-5 relative overflow-hidden group">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold truncate">
                    Total Durasi
                  </span>
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 shrink-0" />
                </div>
                <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums truncate">
                    {weekDurationFormatted}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 sm:mt-1 truncate">
                  <span>
                    Rata-rata {weekCount > 0 ? Math.round(weekDurationSec / weekCount / 60) : 0} mnt / sesi
                  </span>
                </div>
              </div>

              {/* Card 3: Kalori Terbakar */}
              <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 sm:p-4 lg:p-5 relative overflow-hidden group">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold truncate">
                    Kalori Terbakar
                  </span>
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 shrink-0" />
                </div>
                <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {Math.round(weekCalories).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase font-mono">kkal</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 sm:mt-1 truncate">
                  <span>~{Math.round(weekCalories / 7)} kkal / hari</span>
                </div>
              </div>

              {/* Card 4: Jumlah Aktivitas */}
              <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 sm:p-4 lg:p-5 relative overflow-hidden group">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold truncate">
                    Jumlah Aktivitas
                  </span>
                  <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FC5200] shrink-0" />
                </div>
                <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {weekCount}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 uppercase font-mono">sesi</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 sm:mt-1 truncate">
                  <span>Pekan berjalan</span>
                </div>
              </div>
            </div>

            {/* Tingkat 2 Visual: All-Time Milestones Companion Strip */}
            <div className="bg-zinc-50/80 dark:bg-[#151518] border border-zinc-200/70 dark:border-zinc-800/70 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Trophy className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-zinc-600 dark:text-zinc-400 text-xs">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                    All-Time Milestones:
                  </span>
                  <span className="tabular-nums">
                    <strong className="text-zinc-800 dark:text-zinc-200 font-mono">{allDistanceKm} km</strong> jarak
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <span className="tabular-nums">
                    <strong className="text-zinc-800 dark:text-zinc-200 font-mono">{allDurationHours} jam</strong> total
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <span className="tabular-nums">
                    <strong className="text-zinc-800 dark:text-zinc-200 font-mono">{allCount} sesi</strong> tercatat
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700 hidden md:inline">•</span>
                  <span className="tabular-nums hidden md:inline">
                    Rekor jarak: <strong className="text-zinc-800 dark:text-zinc-200 font-mono">{longestActivityKm} km</strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewMode('all')}
                className="text-xs font-semibold text-[#FC5200] hover:text-[#E04900] flex items-center gap-1 transition-colors self-end sm:self-auto cursor-pointer shrink-0"
              >
                <span>Lihat Kumulatif Lengkap</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Tier B: All-Time / Cumulative View */
          <div className="space-y-3">
            {/* All-Time Milestones Hero Banner */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                    <Trophy className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Total Akumulasi & Milestones Karir
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                        {allCount} Aktivitas
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Catatan kumulatif sejak pertama kali terhubung dengan Strava & FitAI
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewMode('week')}
                  className="text-xs font-semibold text-[#FC5200] hover:text-[#E04900] flex items-center gap-1 transition-colors self-end sm:self-auto cursor-pointer"
                >
                  <span>Kembali ke Target Minggu Ini</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Milestone badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">Rekor Terpanjang</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{longestActivityKm} km</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">Total Jam Olahraga</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{allDurationHours} jam</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">Total Kalori</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{Math.round(allCalories).toLocaleString('id-ID')} kkal</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">Berat Terkini</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{latestWeight} kg</span>
                </div>
              </div>
            </div>

            {/* 4 All-Time KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {/* Card 1: Akumulasi Jarak */}
              <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 sm:p-4 lg:p-5 relative overflow-hidden group">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold truncate">
                    Akumulasi Jarak
                  </span>
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FC5200] shrink-0" />
                </div>
                <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {allDistanceKm}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 uppercase font-mono">km</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 sm:mt-1 truncate">
                  <span>Seluruh rute tercatat</span>
                </div>
              </div>

              {/* Card 2: Total Durasi Bergerak */}
              <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 sm:p-4 lg:p-5 relative overflow-hidden group">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold truncate">
                    Total Durasi
                  </span>
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 shrink-0" />
                </div>
                <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums truncate">
                    {allDurationFormatted}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 sm:mt-1 truncate">
                  <span>{allDurationHours} jam latihan</span>
                </div>
              </div>

              {/* Card 3: Total Kalori Karir */}
              <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 sm:p-4 lg:p-5 relative overflow-hidden group">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold truncate">
                    Total Kalori
                  </span>
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 shrink-0" />
                </div>
                <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {Math.round(allCalories).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase font-mono">kkal</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 sm:mt-1 truncate">
                  <span>Energi karir atlet</span>
                </div>
              </div>

              {/* Card 4: Total Sesi Latihan */}
              <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 sm:p-4 lg:p-5 relative overflow-hidden group">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold truncate">
                    Total Sesi
                  </span>
                  <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                </div>
                <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {allCount}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 uppercase font-mono">sesi</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 sm:mt-1 truncate">
                  <span>Rekor: {longestActivityKm} km</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. Interactive Trend Charts (Recharts: Weekly Volume & Weight Trend) */}
      <section className="overflow-hidden">
        <DashboardCharts
          activities={initialActivities}
          weightLogs={initialWeightLogs}
          foodLogs={initialFoodLogs}
        />
      </section>

      {/* 4. Weekly AI Performance Intelligence */}
      <section id="insights">
        <WeeklyAiInsight initialInsight={initialInsight} />
      </section>

      {/* 6. Feed Ringkas Overview: Recent Activities & Nutrition */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Feed Ringkas Aktivitas Terbaru (Max 3-4 items) */}
        <div id="activities" className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Aktivitas Terbaru
              </h2>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-200/60 dark:border-zinc-700/60">
                {viewMode === 'week' ? 'Pekan Ini' : 'All-Time'}
              </span>
            </div>

            <Link
              href="/activities"
              className="text-xs font-semibold text-[#FC5200] hover:text-[#E04900] flex items-center gap-1 transition-colors"
            >
              <span>Halaman Aktivitas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <ActivityList
            activities={viewMode === 'week' && weekActivities.length > 0 ? weekActivities : initialActivities}
            onActivityDeleted={handleRefresh}
            isOverview={true}
          />
        </div>

        {/* Right Column: Ringkasan Nutrisi Harian & Energy Balance */}
        <div id="nutrition" className="lg:col-span-5 space-y-6">
          <DailyStepCheckInCard
            auditData={initialNutritionAudit}
            onCheckInSuccess={handleRefresh}
          />
          {initialNutritionAudit && (
            <DailyNutritionAuditCard
              initialAudit={initialNutritionAudit}
              isOverview={true}
              onRefreshSuccess={handleRefresh}
            />
          )}
          <NutritionSummary
            foodLogs={initialFoodLogs}
            onLogDeleted={handleRefresh}
            isOverview={true}
          />
        </div>
      </section>

      {/* 7. Action Modals (Pristine, clean overlays) */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Catat Aktivitas Latihan"
        description="Pilih jenis olahraga lari atau gym untuk mencatat sesi latihan Anda"
        maxWidth="lg"
      >
        <ManualActivityForm
          isModal
          onSuccess={() => {
            setIsActivityModalOpen(false);
            handleRefresh();
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
            handleRefresh();
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
            handleRefresh();
          }}
        />
      </Modal>

      {/* 8. Thumb-friendly Mobile Bottom Navigation Bar & FAB Speed Dial */}
      <BottomNav
        onOpenActivityModal={() => setIsActivityModalOpen(true)}
        onOpenFoodModal={() => setIsFoodModalOpen(true)}
        onOpenWeightModal={() => setIsWeightModalOpen(true)}
      />
    </div>
  );
}
