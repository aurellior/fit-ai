'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ActivityType, ActivitySource } from '@prisma/client';

const gymSetSchema = z.object({
  exercise: z.string().min(1, 'Nama gerakan wajib diisi'),
  sets: z.coerce.number().min(1, 'Set minimal 1'),
  reps: z.coerce.number().min(1, 'Reps minimal 1'),
  weightKg: z.coerce.number().min(0, 'Beban tidak boleh negatif'),
});

const manualActivitySchema = z.object({
  type: z.nativeEnum(ActivityType),
  title: z.string().min(3, 'Judul aktivitas minimal 3 karakter'),
  startTime: z.string().transform((val) => new Date(val)),
  durationMinutes: z.coerce.number().positive('Durasi harus lebih dari 0 menit'),
  distanceKm: z.coerce.number().optional().nullable(),
  calories: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  gymSets: z.array(gymSetSchema).optional().nullable(),
});

export type ManualActivityInput = z.input<typeof manualActivitySchema>;

export async function createManualActivity(input: unknown) {
  try {
    const user = await getCurrentUser();
    const parseResult = manualActivitySchema.safeParse(input);

    if (!parseResult.success) {
      return {
        success: false,
        errors: parseResult.error.flatten().fieldErrors,
      };
    }

    const data = parseResult.data;
    const durationSec = Math.round(data.durationMinutes * 60);
    const distanceMeters = data.distanceKm ? data.distanceKm * 1000 : null;

    let avgPaceSecPerKm: number | null = null;
    if (data.distanceKm && data.distanceKm > 0) {
      avgPaceSecPerKm = durationSec / data.distanceKm;
    }

    const activity = await prisma.activity.create({
      data: {
        userId: user.id,
        source: ActivitySource.MANUAL,
        type: data.type,
        title: data.title,
        startTime: data.startTime,
        durationSec,
        distanceMeters,
        avgPaceSecPerKm,
        calories: data.calories || null,
        notes: data.notes || null,
        gymSets: data.gymSets && data.gymSets.length > 0 ? JSON.parse(JSON.stringify(data.gymSets)) : undefined,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/activities');

    return {
      success: true,
      data: {
        ...activity,
        stravaActivityId: activity.stravaActivityId ? activity.stravaActivityId.toString() : null,
      },
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Gagal menyimpan aktivitas';
    console.error('Error creating manual activity:', error);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export async function getActivities(limit = 30) {
  const user = await getCurrentUser();
  const activities = await prisma.activity.findMany({
    where: { userId: user.id },
    orderBy: { startTime: 'desc' },
    take: limit,
  });

  return activities.map((item) => ({
    ...item,
    stravaActivityId: item.stravaActivityId ? item.stravaActivityId.toString() : null,
  }));
}

export async function deleteActivity(id: string) {
  const user = await getCurrentUser();
  await prisma.activity.deleteMany({
    where: {
      id,
      userId: user.id,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/activities');
  return { success: true };
}
