'use server';

import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function logDailyStepsAction({
  dateStr,
  stepCount,
  source = 'MANUAL',
  notes,
}: {
  dateStr: string;
  stepCount: number;
  source?: string;
  notes?: string;
}) {
  try {
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
        source,
        notes,
        loggedAt: new Date(),
      },
      update: {
        stepCount: count,
        source,
        notes,
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

    return { success: true, data: stepLog };
  } catch (err) {
    console.error('Failed to log daily steps:', err);
    return { success: false, error: 'Gagal mencatat langkah harian' };
  }
}

export async function getDailyStepLogAction(dateStr: string) {
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
    return stepLog;
  } catch (err) {
    console.warn('Failed to get daily step log:', err);
    return null;
  }
}
