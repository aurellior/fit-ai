'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { ActionResult, FoodLogData } from '@/types';

export async function getFoodLogs(limit = 10): Promise<FoodLogData[]> {
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

const deleteFoodLogSchema = z.object({
  id: z.string().min(1, 'ID log makanan wajib disertakan'),
});

export async function deleteFoodLog(id: string): Promise<ActionResult<{ id: string }>> {
  const parsed = deleteFoodLogSchema.safeParse({ id });
  if (!parsed.success) {
    return { success: false, error: 'ID log makanan tidak valid' };
  }

  try {
    const user = await getCurrentUser();
    await prisma.foodLog.deleteMany({
      where: {
        id: parsed.data.id,
        userId: user.id,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/nutrition');
    return { success: true, data: { id: parsed.data.id } };
  } catch (err) {
    console.warn('Error deleting food log:', err);
    return { success: false, error: 'Gagal menghapus catatan makanan dari database' };
  }
}

export async function getDailyNutritionAuditAction(dateStr?: string, forceRefresh = false) {
  const user = await getCurrentUser();
  const { getDailyNutritionAudit } = await import('@/lib/services/nutrition-audit');
  return await getDailyNutritionAudit({
    userId: user.id,
    targetDate: dateStr ? new Date(dateStr) : new Date(),
    forceAiRefresh: forceRefresh,
  });
}

export async function getNutritionAuditHistoryAction(days = 7) {
  const user = await getCurrentUser();
  const { getNutritionAuditHistory } = await import('@/lib/services/nutrition-audit');
  return await getNutritionAuditHistory({
    userId: user.id,
    days,
  });
}

export async function logDailyStepsAction(input: unknown) {
  const { logDailyStepsAction: logSteps } = await import('@/actions/steps');
  return await logSteps(input);
}

const logFoodTextSchema = z.object({
  description: z.string().trim().min(2, 'Deskripsi makanan minimal 2 karakter'),
});

export async function logFoodFromTextAction(
  description: string
): Promise<ActionResult<FoodLogData>> {
  const parsed = logFoodTextSchema.safeParse({ description });
  if (!parsed.success) {
    return {
      success: false,
      error: 'Deskripsi makanan tidak valid',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const user = await getCurrentUser();
    const { parseFoodTextWithAI, saveFoodLogFromNutrition } = await import(
      '@/lib/services/food-text-parser'
    );

    const nutrition = await parseFoodTextWithAI(parsed.data.description);
    const savedLog = await saveFoodLogFromNutrition(user.id, nutrition);

    revalidatePath('/nutrition');
    revalidatePath('/dashboard');
    revalidatePath('/activities');

    return {
      success: true,
      data: savedLog,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memproses catatan teks makanan';
    console.error('Error logging food from text:', error);
    return { success: false, error: msg };
  }
}

