import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { FoodLogData, DailyNutritionAuditData } from '@/types';
import NutritionClientView from '@/components/nutrition/NutritionClientView';
import { MOCK_FOOD_LOGS } from '@/lib/mockData';
import { getNutritionAuditHistory } from '@/lib/services/nutrition-audit';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Riwayat Nutrisi & Log Makanan | FitAI',
  description: 'Daftar riwayat konsumsi kalori dan makronutrisi harian dari AI Food Scanner dengan pagination.',
};

export default async function NutritionPage() {
  let foodLogs: FoodLogData[] = [];
  let auditHistory: DailyNutritionAuditData[] = [];

  try {
    const user = await getCurrentUser();
    const [rawLogs, history] = await Promise.all([
      prisma.foodLog.findMany({
        where: { userId: user.id },
        orderBy: { loggedAt: 'desc' },
        take: 100,
      }),
      getNutritionAuditHistory({ userId: user.id, days: 7 }),
    ]);

    if (rawLogs.length > 0) {
      foodLogs = rawLogs;
    } else {
      foodLogs = MOCK_FOOD_LOGS;
    }
    auditHistory = history;
  } catch (err) {
    console.warn('Fallback to mock food logs on NutritionPage:', err);
    foodLogs = MOCK_FOOD_LOGS;
    try {
      auditHistory = await getNutritionAuditHistory({ userId: 'demo_user', days: 7 });
    } catch {
      // Ignore
    }
  }

  return (
    <div className="w-full px-3 sm:px-4 py-4">
      <NutritionClientView
        initialFoodLogs={foodLogs}
        initialAuditHistory={auditHistory}
        itemsPerPage={8}
      />
    </div>
  );
}
