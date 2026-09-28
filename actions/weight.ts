'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const weightLogSchema = z.object({
  weightKg: z.coerce.number().positive('Berat badan harus lebih dari 0 kg'),
  loggedAt: z.string().optional().transform((val) => (val ? new Date(val) : new Date())),
  notes: z.string().optional(),
});

export async function logWeight(input: unknown) {
  try {
    const user = await getCurrentUser();
    const parsed = weightLogSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const log = await prisma.weightLog.create({
      data: {
        userId: user.id,
        weightKg: parsed.data.weightKg,
        loggedAt: parsed.data.loggedAt,
        notes: parsed.data.notes,
      },
    });

    revalidatePath('/dashboard');
    return { success: true, data: log };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Gagal menyimpan catatan berat badan';
    return { success: false, error: errorMsg };
  }
}

export async function getWeightLogs(limit = 14) {
  const user = await getCurrentUser();
  return prisma.weightLog.findMany({
    where: { userId: user.id },
    orderBy: { loggedAt: 'desc' },
    take: limit,
  });
}
