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
  Plus,
  Camera,
  Scale,
  MapPin,
  Clock,
  Flame,
  ChevronRight,
} from 'lucide-react';
import {
  UserProfile,
  StravaTokenData,
  ActivityData,
  AiInsightData,
  FoodLogData,
  WeightLogData,
} from '@/types';
import { formatDuration } from '@/lib/utils';

interface DashboardClientViewProps {
  user: UserProfile | null;
  stravaToken: StravaTokenData | null;
  initialActivities: ActivityData[];
  initialInsight: AiInsightData | null;
  initialFoodLogs: FoodLogData[];
  initialWeightLogs: WeightLogData[];
}

export default function DashboardClientView({
  user,
  stravaToken,
  initialActivities,
  initialInsight,
  initialFoodLogs,
  initialWeightLogs,
}: DashboardClientViewProps) {
  const router = useRouter();

  // Modals state (Keeps dashboard pristine & clutter-free)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  // 1. Core Athlete Metrics (Requested: Total Jarak, Total Durasi, Kalori, dan Berat Badan)
  const totalDistanceMeters = initialActivities.reduce(
    (acc, act) => acc + (act.distanceMeters || 0),
    0
  );
  const totalDistanceKm = (totalDistanceMeters / 1000).toFixed(1);

  const totalDurationSec = initialActivities.reduce(
    (acc, act) => acc + (act.durationSec || 0),
    0
  );
  const totalDurationFormatted = formatDuration(totalDurationSec);

  const totalCalories = initialActivities.reduce(
    (acc, act) => acc + (act.calories || 0),
    0
  );

  const latestWeight = initialWeightLogs[0]?.weightKg || 68.0;

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-24 md:pb-12">
      {/* 1. Athlete Hero Header & Quick Action Trigger Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FC5200]"></span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Athlete Dashboard Overview
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-0.5">
            Ringkasan Performa
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {user?.name || user?.email || 'Demo Athlete'} • Sinkronisasi Strava & Gemini AI
          </p>
        </div>

        {/* Desktop Quick Action Buttons (Opens Clean Modals) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsActivityModalOpen(true)}
            className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-[#FC5200] hover:bg-[#E04900] text-white flex items-center gap-1.5 transition-colors shadow-xs active:scale-98"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Catat Aktivitas</span>
          </button>

          <button
            onClick={() => setIsFoodModalOpen(true)}
            className="text-xs font-medium px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition-colors bg-white dark:bg-zinc-900 shadow-xs"
          >
            <Camera className="w-3.5 h-3.5 text-zinc-500" />
            <span>Scan Makanan</span>
          </button>

          <button
            onClick={() => setIsWeightModalOpen(true)}
            className="text-xs font-medium px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition-colors bg-white dark:bg-zinc-900 shadow-xs"
          >
            <Scale className="w-3.5 h-3.5 text-zinc-500" />
            <span>Log Berat</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards (Clean Strava Style: Total Jarak, Total Durasi, Kalori, Berat Badan) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
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
              {totalDistanceKm}
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 uppercase font-mono">km</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 sm:mt-1 truncate">
            <span>Rute lari & gowes</span>
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
              {totalDurationFormatted}
            </span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 sm:mt-1 truncate">
            <span>{initialActivities.length} sesi latihan</span>
          </div>
        </div>

        {/* Card 3: Kalori Terbakar */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 sm:p-4 lg:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold truncate">
              Kalori
            </span>
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 shrink-0" />
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
              {totalCalories.toLocaleString()}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase font-mono">kkal</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 sm:mt-1 truncate">
            <span>Energi terbakar</span>
          </div>
        </div>

        {/* Card 4: Berat Badan Terkini */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 sm:p-4 lg:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold truncate">
              Berat Badan
            </span>
            <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
              {latestWeight}
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 uppercase font-mono">kg</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 sm:mt-1 truncate">
            <span>Massa tubuh</span>
          </div>
        </div>
      </section>

      {/* 3. Interactive Trend Charts (Recharts: Weekly Volume & Weight Trend) */}
      <section className="overflow-hidden">
        <DashboardCharts
          activities={initialActivities}
          weightLogs={initialWeightLogs}
          foodLogs={initialFoodLogs}
        />
      </section>

      {/* 4. Strava Status Banner */}
      <section id="strava-section">
        <StravaConnectButton
          isConnected={!!stravaToken}
          athleteId={stravaToken?.athleteId}
          onSyncComplete={handleRefresh}
        />
      </section>

      {/* 5. Weekly AI Performance Intelligence */}
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
                Overview
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
            activities={initialActivities}
            onActivityDeleted={handleRefresh}
            isOverview={true}
          />
        </div>

        {/* Right Column: Ringkasan Nutrisi Harian */}
        <div id="nutrition" className="lg:col-span-5 space-y-6">
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
        title="AI Food Scanner (Multimodal)"
        description="Unggah foto makanan untuk ekstraksi nutrisi & kalori instan dengan Gemini Vision"
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
