import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import DashboardClientView from '@/components/dashboard/DashboardClientView';
import { ActivitySource, ActivityType } from '@prisma/client';
import { cookies } from 'next/headers';
import {
  UserProfile,
  StravaTokenData,
  ActivityData,
  AiInsightData,
  FoodLogData,
  WeightLogData,
  GymSet,
  DailyNutritionAuditData,
} from '@/types';
import { parseCoachPlanFromInsight } from '@/lib/services/performance-insights';
import { getDailyNutritionAudit } from '@/lib/services/nutrition-audit';

export const dynamic = 'force-dynamic';

const BASE_MOCK_DATE = new Date('2026-09-28T08:00:00Z');
const MOCK_START_RUN = new Date(BASE_MOCK_DATE.getTime() - 1000 * 60 * 60 * 6);
const MOCK_START_GYM = new Date(BASE_MOCK_DATE.getTime() - 1000 * 60 * 60 * 28);
const MOCK_FOOD_TIME = new Date(BASE_MOCK_DATE.getTime() - 1000 * 60 * 60 * 3);

export default async function HomePage() {
  let user: UserProfile | null = null;
  let stravaToken: StravaTokenData | null = null;
  let activities: ActivityData[] = [];
  let latestInsight: AiInsightData | null = null;
  let foodLogs: FoodLogData[] = [];
  let weightLogs: WeightLogData[] = [];
  let nutritionAudit: DailyNutritionAuditData | null = null;

  try {
    const dbUser = await getCurrentUser();
    user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatarUrl: dbUser.avatarUrl,
    };

    stravaToken = await prisma.stravaToken.findUnique({
      where: { userId: user.id },
    });

    const rawActivities = await prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { startTime: 'desc' },
      take: 20,
    });

    activities = rawActivities.map((act) => ({
      ...act,
      stravaActivityId: act.stravaActivityId ? act.stravaActivityId.toString() : null,
      gymSets: (act.gymSets as unknown as GymSet[]) || null,
    }));

    const rawInsight = await prisma.aiInsight.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    latestInsight = rawInsight ? parseCoachPlanFromInsight(rawInsight) : null;

    foodLogs = await prisma.foodLog.findMany({
      where: { userId: user.id },
      orderBy: { loggedAt: 'desc' },
      take: 10,
    });

    weightLogs = await prisma.weightLog.findMany({
      where: { userId: user.id },
      orderBy: { loggedAt: 'desc' },
      take: 10,
    });
  } catch (error) {
    console.warn('Database query fallback (PostgreSQL server mungkin belum aktif):', error);

    // Mock initial demo data agar antarmuka dapat langsung diinspeksi
    user = { id: 'demo_user', name: 'Aurellio (Demo)', email: 'athlete@antigravity.fit' };
    stravaToken = null;
    activities = [
      {
        id: 'act-1',
        title: 'Morning Easy Run 5K',
        source: ActivitySource.STRAVA,
        type: ActivityType.RUN,
        startTime: MOCK_START_RUN,
        durationSec: 1680,
        distanceMeters: 5120,
        avgPaceSecPerKm: 328,
        calories: 340,
      },
      {
        id: 'act-2',
        title: 'Upper Body Hypertrophy',
        source: ActivitySource.MANUAL,
        type: ActivityType.WEIGHT_TRAINING,
        startTime: MOCK_START_GYM,
        durationSec: 3300,
        calories: 280,
        notes: 'Target dada dan tricep. Menambah beban pada incline bench press.',
        gymSets: [
          { exercise: 'Barbell Bench Press', sets: 4, reps: 8, weightKg: 75 },
          { exercise: 'Incline Dumbbell Press', sets: 3, reps: 10, weightKg: 24 },
          { exercise: 'Tricep Rope Pushdown', sets: 4, reps: 12, weightKg: 30 },
        ],
      },
    ];
    latestInsight = parseCoachPlanFromInsight({
      id: 'ins-1',
      summary:
        'Volume latihan kardio dan latihan beban seimbang. Pace pada lari pagi menunjukkan efisiensi aerobik yang konsisten pada zona 2-3.',
      strengths:
        'Disiplin latihan beban secara terstruktur dan kemampuan mempertahankan cadence stabil pada sesi lari.',
      recommendations:
        'Jaga asupan protein harian minimal 1.6g/kg berat badan dan pastikan tidur 7-8 jam untuk pemulihan jaringan otot.',
      periodStart: MOCK_START_GYM,
      periodEnd: BASE_MOCK_DATE,
      createdAt: BASE_MOCK_DATE,
    });
    foodLogs = [
      {
        id: 'fd-1',
        foodName: 'Dada Ayam Panggang & Nasi Merah',
        calories: 520,
        proteinG: 45,
        carbsG: 50,
        fatG: 12,
        loggedAt: MOCK_FOOD_TIME,
      },
    ];
    weightLogs = [
      {
        id: 'wt-1',
        weightKg: 68.5,
        loggedAt: BASE_MOCK_DATE,
        notes: 'Pagi setelah bangun tidur',
      },
    ];
  }

  // Fallback: Jika database belum aktif/terkoneksi, gunakan cookie session untuk status Strava
  try {
    const cookieStore = await cookies();
    const isConnectedCookie = cookieStore.get('strava_connected')?.value === 'true';
    const athleteIdCookie = cookieStore.get('strava_athlete_id')?.value;

    if (!stravaToken && isConnectedCookie) {
      stravaToken = {
        id: 'cookie_token',
        userId: user?.id || 'demo_user',
        athleteId: athleteIdCookie || 'connected',
        accessToken: '',
        refreshToken: '',
        expiresAt: new Date(Date.now() + 86400000 * 30),
      };
    }
  } catch {
    // Ignore cookie errors
  }

  try {
    nutritionAudit = await getDailyNutritionAudit({
      userId: user?.id || 'demo_user',
    });
  } catch (err) {
    console.warn('Failed to load initial nutrition audit:', err);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <DashboardClientView
        user={user}
        stravaToken={stravaToken}
        initialActivities={activities}
        initialInsight={latestInsight}
        initialFoodLogs={foodLogs}
        initialWeightLogs={weightLogs}
        initialNutritionAudit={nutritionAudit || undefined}
      />
    </div>
  );
}
