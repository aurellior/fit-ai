'use client';

import React, { useState } from 'react';
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
import { useRouter } from 'next/navigation';
import { Plus, Camera, Scale } from 'lucide-react';
import {
  UserProfile,
  StravaTokenData,
  ActivityData,
  AiInsightData,
  FoodLogData,
  WeightLogData,
} from '@/types';

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

  // Modal states
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  // Core Metrics
  const totalWorkouts = initialActivities.length;
  const totalDistanceMeters = initialActivities.reduce(
    (acc, act) => acc + (act.distanceMeters || 0),
    0
  );
  const totalDistanceKm = (totalDistanceMeters / 1000).toFixed(1);
  const totalCalories = initialActivities.reduce((acc, act) => acc + (act.calories || 0), 0);
  const totalGymSessions = initialActivities.filter((a) => a.type === 'WEIGHT_TRAINING').length;

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-24 md:pb-8">
      {/* 1. Header & Dedicated Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Ringkasan Kebugaran
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {user?.name || user?.email || 'Demo Athlete'} • Integrasi Strava & Gemini AI
          </p>
        </div>

        {/* Desktop Quick Action Buttons (Opens Modals) */}
        <div className="hidden sm:flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsActivityModalOpen(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Latihan</span>
          </button>

          <button
            onClick={() => setIsFoodModalOpen(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-colors"
          >
            <Camera className="w-3.5 h-3.5 text-zinc-500" />
            <span>Scan Makanan</span>
          </button>

          <button
            onClick={() => setIsWeightModalOpen(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-colors"
          >
            <Scale className="w-3.5 h-3.5 text-zinc-500" />
            <span>Log Berat Badan</span>
          </button>
        </div>
      </div>

      {/* 2. Top Statistic KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4">
          <span className="text-[10px] sm:text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
            Total Sesi
          </span>
          <div className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums mt-1 font-mono">
            {totalWorkouts} <span className="text-xs font-normal text-zinc-500">sesi</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4">
          <span className="text-[10px] sm:text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
            Jarak Tempuh
          </span>
          <div className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums mt-1 font-mono">
            {totalDistanceKm} <span className="text-xs font-normal text-zinc-500">km</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4">
          <span className="text-[10px] sm:text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
            Kalori Latihan
          </span>
          <div className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums mt-1 font-mono">
            {totalCalories} <span className="text-xs font-normal text-zinc-500">kkal</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4">
          <span className="text-[10px] sm:text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
            Latihan Beban
          </span>
          <div className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums mt-1 font-mono">
            {totalGymSessions} <span className="text-xs font-normal text-zinc-500">sesi</span>
          </div>
        </div>
      </section>

      {/* 3. Visual Charts (Recharts) */}
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

      {/* 6. Clean Two-Column Feeds: Recent Activities & Nutrition */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div id="activities" className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Aktivitas Terbaru
            </h2>
            <button
              onClick={() => setIsActivityModalOpen(true)}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              + Catat Baru
            </button>
          </div>
          <ActivityList
            activities={initialActivities}
            onActivityDeleted={handleRefresh}
          />
        </div>

        <div id="nutrition" className="lg:col-span-5 space-y-6">
          <NutritionSummary
            foodLogs={initialFoodLogs}
            onLogDeleted={handleRefresh}
          />
        </div>
      </section>

      {/* 7. Action Modals (Opens seamlessly on mobile bottom-sheet & desktop modal) */}
      {/* Activity Input Modal */}
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

      {/* Food Scanner Modal */}
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

      {/* Weight Log Modal */}
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
