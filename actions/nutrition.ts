'use server';

import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

export async function getFoodLogs(limit = 10) {
  try {
    const user = await getCurrentUser();
    return await prisma.foodLog.findMany({
      where: { userId: user.id },
      orderBy: { loggedAt: 'desc' },
      take: limit,
    });
  } catch (err) {
    console.warn('Error fetching food logs:', err);
    const { MOCK_FOOD_LOGS } = await import('@/lib/mockData');
    return MOCK_FOOD_LOGS.slice(0, limit);
  }
}

export async function getPaginatedFoodLogs({
  page = 1,
  limit = 8,
  search = '',
}: {
  page?: number;
  limit?: number;
  search?: string;
} = {}) {
  try {
    const user = await getCurrentUser();
    const where: Prisma.FoodLogWhereInput = { userId: user.id };

    if (search && search.trim()) {
      where.foodName = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    const [total, foodLogs] = await Promise.all([
      prisma.foodLog.count({ where }),
      prisma.foodLog.findMany({
        where,
        orderBy: { loggedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      foodLogs,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  } catch (err) {
    console.warn('Fallback mock food logs:', err);
    const { MOCK_FOOD_LOGS } = await import('@/lib/mockData');
    let filtered = [...MOCK_FOOD_LOGS];
    if (search && search.trim()) {
      filtered = filtered.filter((f) =>
        f.foodName.toLowerCase().includes(search.toLowerCase())
      );
    }
    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const foodLogs = filtered.slice(startIndex, startIndex + limit);

    return {
      foodLogs,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}

export async function deleteFoodLog(id: string) {
  const user = await getCurrentUser();
  try {
    await prisma.foodLog.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    });
  } catch (err) {
    console.warn('Error deleting food log:', err);
  }

  revalidatePath('/dashboard');
  revalidatePath('/nutrition');
  return { success: true };
}
