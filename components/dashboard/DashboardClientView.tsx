'use client';

import React, { useState } from 'react';
import StravaConnectButton from '@/components/dashboard/StravaConnectButton';
import WeeklyAiInsight from '@/components/dashboard/WeeklyAiInsight';
import ActivityList from '@/components/dashboard/ActivityList';
import NutritionSummary from '@/components/dashboard/NutritionSummary';
import WeightTracker from '@/components/dashboard/WeightTracker';
import ManualActivityForm from '@/components/forms/ManualActivityForm';
import FoodScannerModal from '@/components/forms/FoodScannerModal';
import { useRouter } from 'next/navigation';
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
  const [activities] = useState(initialActivities);
  const [foodLogs] = useState(initialFoodLogs);
  const [weightLogs] = useState(initialWeightLogs);

  // Core Metrics
  const totalWorkouts = activities.length;
  const totalDistanceMeters = activities.reduce(
    (acc, act) => acc + (act.distanceMeters || 0),
    0
  );
  const totalDistanceKm = (totalDistanceMeters / 1000).toFixed(1);
  const totalCalories = activities.reduce((acc, act) => acc + (act.calories || 0), 0);
  const totalGymSessions = activities.filter((a) => a.type === 'WEIGHT_TRAINING').length;

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Overview & Core Metrics */}
      <section id="overview" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Dashboard Kebugaran
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Profil: {user?.name || user?.email || 'Athlete'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Live Sync
            </span>
          </div>
        </div>

        {/* Minimalist Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
              Total Latihan
            </span>
            <div className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums mt-1 font-mono">
              {totalWorkouts} <span className="text-xs font-normal text-zinc-500">sesi</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
              Total Jarak
            </span>
            <div className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums mt-1 font-mono">
              {totalDistanceKm} <span className="text-xs font-normal text-zinc-500">km</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
              Estimasi Kalori
            </span>
            <div className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums mt-1 font-mono">
              {totalCalories} <span className="text-xs font-normal text-zinc-500">kkal</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
              Latihan Beban
            </span>
            <div className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums mt-1 font-mono">
              {totalGymSessions} <span className="text-xs font-normal text-zinc-500">sesi</span>
            </div>
          </div>
        </div>
      </section>

      {/* Strava Integration Hub */}
      <section id="strava-section">
        <StravaConnectButton
          isConnected={!!stravaToken}
          athleteId={stravaToken?.athleteId}
          onSyncComplete={handleRefresh}
        />
      </section>

      {/* Performance Intelligence */}
      <section id="insights">
        <WeeklyAiInsight initialInsight={initialInsight} />
      </section>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Forms */}
        <div className="lg:col-span-5 space-y-6">
          <section id="manual-input">
            <ManualActivityForm onSuccess={handleRefresh} />
          </section>

          <section id="food-scanner">
            <FoodScannerModal onScanSuccess={handleRefresh} />
          </section>
        </div>

        {/* Right Column: Feeds & Nutrition Trackers */}
        <div className="lg:col-span-7 space-y-6">
          <section id="activities">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Riwayat Aktivitas
              </h2>
              <span className="text-xs text-zinc-500">Strava & Manual</span>
            </div>
            <ActivityList activities={activities} onActivityDeleted={handleRefresh} />
          </section>

          <section id="nutrition">
            <NutritionSummary foodLogs={foodLogs} onLogDeleted={handleRefresh} />
          </section>

          <section id="weight">
            <WeightTracker logs={weightLogs} onWeightLogged={handleRefresh} />
          </section>
        </div>
      </div>
    </div>
  );
}
