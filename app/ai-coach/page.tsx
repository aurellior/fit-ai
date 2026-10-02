import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  generateWeeklyPerformanceInsight,
  parseCoachPlanFromInsight,
} from '@/lib/services/performance-insights';
import CoachClientView from '@/components/coach/CoachClientView';
import { AiInsightData, UserProfile } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AI Coach Intelligence & Adaptive Running Plan | FitAI',
  description:
    'Program lari adaptif cerdas untuk hari Senin (Speed), Kamis (Interval), dan Sabtu (Long Run) dengan smart skip handling bersama AI Coach FitAI.',
};

export default async function AiCoachPage() {
  let user: UserProfile | null = null;
  let insight: AiInsightData | null = null;

  try {
    const dbUser = await getCurrentUser();
    user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatarUrl: dbUser.avatarUrl,
    };

    const latestInsight = await prisma.aiInsight.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (latestInsight) {
      insight = parseCoachPlanFromInsight(latestInsight);
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
        'Sesi Senin terlewat minggu ini. Sistem kami telah otomatis menyesuaikan target lari Kamis agar Anda tetap berkembang tanpa risiko kelelahan berlebih.',
      strengths: 'Kemampuan menjaga ritme kardio pada lari 5K sudah stabil.',
      recommendations: '',
      createdAt: new Date(),
    });
  }

  return (
    <div className="w-full px-3 sm:px-4 py-4">
      <CoachClientView user={user} initialInsight={insight} />
    </div>
  );
}
