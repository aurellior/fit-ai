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

    const [
      dbStravaToken,
      rawActivities,
      rawInsight,
      dbFoodLogs,
      dbWeightLogs,
      dbNutritionAudit,
    ] = await Promise.all([
      prisma.stravaToken.findUnique({
        where: { userId: user.id },
      }),
      prisma.activity.findMany({
        where: { userId: user.id },
        orderBy: { startTime: 'desc' },
        take: 20,
      }),
      prisma.aiInsight.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.foodLog.findMany({
        where: { userId: user.id },
        orderBy: { loggedAt: 'desc' },
        take: 10,
      }),
      prisma.weightLog.findMany({
        where: { userId: user.id },
        orderBy: { loggedAt: 'desc' },
        take: 10,
      }),
      getDailyNutritionAudit({
        userId: user.id,
      }).catch((auditErr) => {
        console.warn('Initial nutrition audit query warning:', auditErr);
        return null;
      }),
    ]);

    stravaToken = dbStravaToken;
    activities = rawActivities.map((act) => ({
      ...act,
      stravaActivityId: act.stravaActivityId ? act.stravaActivityId.toString() : null,
      gymSets: (act.gymSets as unknown as GymSet[]) || null,
    }));
    latestInsight = rawInsight ? parseCoachPlanFromInsight(rawInsight, activities) : null;
    foodLogs = dbFoodLogs;
    weightLogs = dbWeightLogs;
    nutritionAudit = dbNutritionAudit;
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
        title: 'Tempo Threshold Run 6K',
        source: ActivitySource.MANUAL,
        type: ActivityType.RUN,
        startTime: MOCK_START_GYM,
        durationSec: 2160,
        distanceMeters: 6000,
        avgPaceSecPerKm: 360,
        calories: 410,
        notes: 'Lari tempo di zona laktat. Ritme nafas stabil 2-2, cadence 172 spm.',
      },
    ];
    latestInsight = parseCoachPlanFromInsight({
      id: 'ins-1',
      summary:
        'Volume lari mingguan seimbang. Ritme aerobik terjaga optimal pada zona 2-3.',
      strengths:
        'Konsistensi cadence stabil dan pacing merata di setiap kilometer.',
      recommendations:
        'Pertahankan hidrasi elektrolit dan istirahat teratur untuk pemulihan otot.',
      periodStart: MOCK_START_GYM,
      periodEnd: BASE_MOCK_DATE,
      createdAt: BASE_MOCK_DATE,
    }, activities);
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

  if (!nutritionAudit) {
    try {
      nutritionAudit = await getDailyNutritionAudit({
        userId: user?.id || 'demo_user',
      });
    } catch (err) {
      console.warn('Failed to load fallback nutrition audit:', err);
    }
  }

  return (
    <div className="w-full px-3 sm:px-4 py-4">
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
