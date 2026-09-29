import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ActivityData, GymSet } from '@/types';
import ActivitiesClientView from '@/components/activities/ActivitiesClientView';
import { MOCK_ACTIVITIES } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Riwayat Aktivitas & Detail Latihan | FitAI',
  description: 'Daftar lengkap sesi lari, gym, dan olahraga dengan fitur filter dan pagination.',
};

export default async function ActivitiesPage() {
  let activities: ActivityData[] = [];

  try {
    const user = await getCurrentUser();
    const rawActivities = await prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { startTime: 'desc' },
      take: 200,
    });

    if (rawActivities.length > 0) {
      activities = rawActivities.map((act) => ({
        ...act,
        stravaActivityId: act.stravaActivityId ? act.stravaActivityId.toString() : null,
        gymSets: (act.gymSets as unknown as GymSet[]) || null,
      }));
    } else {
      activities = MOCK_ACTIVITIES;
    }
  } catch (error) {
    console.warn('Fallback to mock activities on ActivitiesPage:', error);
    activities = MOCK_ACTIVITIES;
  }

  const itemsPerPage = 6;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <ActivitiesClientView
        initialActivities={activities}
        currentPage={1}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
}
