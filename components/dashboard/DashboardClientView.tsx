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
import { Activity, Dumbbell, Flame, TrendingUp } from 'lucide-react';
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

  // Quick Stats
  const totalWorkouts = activities.length;
  const totalDistanceMeters = activities.reduce(
    (acc, act) => acc + (act.distanceMeters || 0),
    0
  );
  const totalDistanceKm = (totalDistanceMeters / 1000).toFixed(1);
  const totalCalories = activities.reduce((acc, act) => acc + (act.calories || 0), 0);

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner & Summary KPIs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Personal Fitness Monolith
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              Halo, {user?.name || 'Athlete'} 👋
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Pantau seluruh aktivitas Strava, latihan gym, nutrisi, dan evaluasi Gemini AI dalam satu dasbor.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Monolith Online
            </span>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Activity className="w-4 h-4 text-emerald-600" /> Total Aktivitas
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {totalWorkouts} <span className="text-xs font-normal text-slate-500">sesi</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Total Jarak
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {totalDistanceKm} <span className="text-xs font-normal text-slate-500">km</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Flame className="w-4 h-4 text-amber-500" /> Kalori Terbakar
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {totalCalories} <span className="text-xs font-normal text-slate-500">kkal</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Dumbbell className="w-4 h-4 text-indigo-500" /> Sesi Angkat Beban
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {activities.filter((a) => a.type === 'WEIGHT_TRAINING').length}{' '}
              <span className="text-xs font-normal text-slate-500">sesi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strava Integration Hub */}
      <section id="strava-section">
        <StravaConnectButton
          isConnected={!!stravaToken}
          athleteId={stravaToken?.athleteId}
          onSyncComplete={handleRefresh}
        />
      </section>

      {/* Gemini AI Performance Insights */}
      <section id="ai-insights">
        <WeeklyAiInsight initialInsight={initialInsight} />
      </section>

      {/* Main Grid: Form Inputs & Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Forms */}
        <div className="lg:col-span-5 space-y-8">
          <section id="manual-input">
            <ManualActivityForm onSuccess={handleRefresh} />
          </section>

          <section id="food-scanner">
            <FoodScannerModal onScanSuccess={handleRefresh} />
          </section>
        </div>

        {/* Right Column: Feeds & Summaries */}
        <div className="lg:col-span-7 space-y-8">
          <section id="activities">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Riwayat Aktivitas Olahraga
              </h3>
              <span className="text-xs text-slate-400">Strava & Manual</span>
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
