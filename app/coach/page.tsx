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
  title: 'AI Running Coach & Directive | FitAI',
  description:
    'Program lari adaptif terstruktur untuk hari Senin (Speed), Kamis (Interval), dan Sabtu (Long Run) bersama AI Coach.',
};

export default async function CoachPage() {
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
      // Proactively generate insight if none exists yet
      insight = await generateWeeklyPerformanceInsight(user.id);
    }
  } catch (error) {
    console.warn('Fallback fetching coach insight in CoachPage:', error);
    user = { id: 'demo_user', name: 'Aurellio (Demo)', email: 'athlete@antigravity.fit' };
    insight = parseCoachPlanFromInsight({
      id: 'ins-demo',
      periodStart: new Date(),
      periodEnd: new Date(),
      summary:
        'Konsistensi adalah kunci nomor satu. Minggu lalu jadwal rutin 3 hari Anda belum tuntas. Minggu ini kita bayar tuntas di Senin, Kamis, dan Sabtu!',
      strengths: 'Kemampuan menjaga kestabilan pace pada lari 5K sudah terbentuk.',
      recommendations: '',
      createdAt: new Date(),
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <CoachClientView user={user} initialInsight={insight} />
    </div>
  );
}
