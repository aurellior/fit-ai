import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { FoodLogData } from '@/types';
import NutritionClientView from '@/components/nutrition/NutritionClientView';
import { MOCK_FOOD_LOGS } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Riwayat Nutrisi & Log Makanan | FitAI',
  description: 'Daftar riwayat konsumsi kalori dan makronutrisi harian dari AI Food Scanner dengan pagination.',
};

export default async function NutritionPage() {
  let foodLogs: FoodLogData[] = [];

  try {
    const user = await getCurrentUser();
    const rawLogs = await prisma.foodLog.findMany({
      where: { userId: user.id },
      orderBy: { loggedAt: 'desc' },
      take: 100,
    });

    if (rawLogs.length > 0) {
      foodLogs = rawLogs;
    } else {
      foodLogs = MOCK_FOOD_LOGS;
    }
  } catch (err) {
    console.warn('Fallback to mock food logs on NutritionPage:', err);
    foodLogs = MOCK_FOOD_LOGS;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <NutritionClientView initialFoodLogs={foodLogs} itemsPerPage={8} />
    </div>
  );
}
