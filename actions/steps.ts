'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ActionResult, StepLogData } from '@/types';

export const logDailyStepsSchema = z.object({
  dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  stepCount: z.coerce.number().min(0, 'Jumlah langkah tidak boleh bernilai negatif'),
  source: z.string().default('MANUAL'),
  notes: z.string().optional().nullable(),
});

export type LogDailyStepsInput = z.infer<typeof logDailyStepsSchema>;

export async function logDailyStepsAction(
  input: unknown
): Promise<ActionResult<StepLogData>> {
  try {
    const parseResult = logDailyStepsSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: 'Data langkah harian tidak valid',
        errors: parseResult.error.flatten().fieldErrors,
      };
    }

    const { dateStr, stepCount, source, notes } = parseResult.data;
    const user = await getCurrentUser();
    const count = Math.max(0, Math.round(stepCount));

    const stepLog = await prisma.stepLog.upsert({
      where: {
        userId_dateStr: {
          userId: user.id,
          dateStr,
        },
      },
      create: {
        userId: user.id,
        dateStr,
        stepCount: count,
        source: source || 'MANUAL',
        notes: notes || null,
        loggedAt: new Date(),
      },
      update: {
        stepCount: count,
        source: source || 'MANUAL',
        notes: notes || null,
        loggedAt: new Date(),
      },
    });

    try {
      revalidatePath('/');
      revalidatePath('/dashboard');
      revalidatePath('/nutrition');
    } catch {
      // Ignore when running outside of Next.js server request lifecycle
    }

    return {
      success: true,
      data: {
        id: stepLog.id,
        userId: stepLog.userId,
        dateStr: stepLog.dateStr,
        stepCount: stepLog.stepCount,
        loggedAt: stepLog.loggedAt,
        source: stepLog.source,
        notes: stepLog.notes,
      },
    };
  } catch (err) {
    console.error('Failed to log daily steps:', err);
    return { success: false, error: 'Gagal mencatat langkah harian ke database' };
  }
}

export async function getDailyStepLogAction(dateStr: string): Promise<StepLogData | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return null;
  }

  try {
    const user = await getCurrentUser();
    const stepLog = await prisma.stepLog.findUnique({
      where: {
        userId_dateStr: {
          userId: user.id,
          dateStr,
        },
      },
    });

    if (!stepLog) return null;

    return {
      id: stepLog.id,
      userId: stepLog.userId,
      dateStr: stepLog.dateStr,
      stepCount: stepLog.stepCount,
      loggedAt: stepLog.loggedAt,
      source: stepLog.source,
      notes: stepLog.notes,
    };
  } catch (err) {
    console.warn('Failed to get daily step log:', err);
    return null;
  }
}
