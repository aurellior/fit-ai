import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  generateWeeklyPerformanceInsight,
  parseCoachPlanFromInsight,
} from '@/lib/services/performance-insights';
import { syncStravaActivities } from '@/lib/services/strava';
import CoachClientView from '@/components/coach/CoachClientView';
import { AiInsightData, UserProfile, ActivityData } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AI Coach Intelligence & Adaptive Running Plan | FitAI',
  description:
    'Program lari adaptif cerdas berkesinambungan dengan antrean sesi latihan otomatis bersama AI Coach FitAI.',
};

export default async function AiCoachPage() {
  let user: UserProfile | null = null;
  let insight: AiInsightData | null = null;
  let activities: ActivityData[] = [];

  try {
    const dbUser = await getCurrentUser();
    user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatarUrl: dbUser.avatarUrl,
    };

    // Cek apakah akun Strava terhubung dan apakah data sudah stale (> 1 jam)
    const stravaToken = await prisma.stravaToken.findUnique({
      where: { userId: user.id },
      select: { updatedAt: true },
    });

    let didAutoSync = false;
    if (stravaToken) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (stravaToken.updatedAt < oneHourAgo) {
        try {
          const syncRes = await syncStravaActivities(user.id);
          await prisma.stravaToken.update({
            where: { userId: user.id },
            data: { updatedAt: new Date() },
          });
          didAutoSync = syncRes.syncedCount > 0;
        } catch (syncErr) {
          console.warn('Auto-sync Strava on AI Coach page load fallback:', syncErr);
        }
      }
    }

    const [latestInsight, rawActivities] = await Promise.all([
      prisma.aiInsight.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activity.findMany({
        where: { userId: user.id },
        orderBy: { startTime: 'desc' },
        take: 100, // Ambil hingga 100 aktivitas untuk analisis tren multi-minggu (4-6 minggu)
      }),
    ]);

    activities = rawActivities.map((act) => ({
      ...act,
      stravaActivityId: act.stravaActivityId ? act.stravaActivityId.toString() : null,
      gymSets: (act.gymSets as unknown as import('@/types').GymSet[]) || null,
    }));

    if (latestInsight && !didAutoSync) {
      insight = parseCoachPlanFromInsight(latestInsight, activities);
    } else {
      insight = await generateWeeklyPerformanceInsight(user.id);
    }
  } catch (error) {
    console.warn('Fallback in AiCoachPage:', error);
    user = { id: 'demo_user', name: 'Aurellio (Demo)', email: 'athlete@antigravity.fit' };
    insight = parseCoachPlanFromInsight({
      id: 'ins-demo',
      periodStart: new Date(),
      periodEnd: new Date(),
      summary:
        'Sistem kami otomatis menyesuaikan antrean latihan agar Anda tetap berkembang tanpa risiko kelelahan berlebih.',
      strengths: 'Kemampuan menjaga ritme kardio pada lari 5K sudah stabil.',
      recommendations: '',
      createdAt: new Date(),
    });
  }

  return (
    <div className="w-full px-3 sm:px-4 py-4">
      <CoachClientView user={user} initialInsight={insight} activities={activities} />
    </div>
  );
}
