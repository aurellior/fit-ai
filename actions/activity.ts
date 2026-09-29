'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ActivityType, ActivitySource, Prisma } from '@prisma/client';

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
  try {
    const user = await getCurrentUser();
    const activities = await prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { startTime: 'desc' },
      take: limit,
    });

    return activities.map((item) => ({
      ...item,
      stravaActivityId: item.stravaActivityId ? item.stravaActivityId.toString() : null,
      gymSets: (item.gymSets as unknown as import('@/types').GymSet[]) || null,
    }));
  } catch (err) {
    console.warn('Error fetching activities:', err);
    const { MOCK_ACTIVITIES } = await import('@/lib/mockData');
    return MOCK_ACTIVITIES.slice(0, limit);
  }
}

export async function getPaginatedActivities({
  page = 1,
  limit = 8,
  type = 'ALL',
  source = 'ALL',
  search = '',
}: {
  page?: number;
  limit?: number;
  type?: string;
  source?: string;
  search?: string;
} = {}) {
  try {
    const user = await getCurrentUser();
    const where: Prisma.ActivityWhereInput = { userId: user.id };

    if (type && type !== 'ALL') {
      where.type = type as ActivityType;
    }

    if (source && source !== 'ALL') {
      where.source = source as ActivitySource;
    }

    if (search && search.trim()) {
      where.title = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    const [total, rawActivities] = await Promise.all([
      prisma.activity.count({ where }),
      prisma.activity.findMany({
        where,
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const activities = rawActivities.map((item) => ({
      ...item,
      stravaActivityId: item.stravaActivityId ? item.stravaActivityId.toString() : null,
      gymSets: (item.gymSets as unknown as import('@/types').GymSet[]) || null,
    }));

    return {
      activities,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  } catch (err) {
    console.warn('Database error in getPaginatedActivities, using mock data:', err);
    const { MOCK_ACTIVITIES } = await import('@/lib/mockData');
    let filtered = [...MOCK_ACTIVITIES];

    if (type && type !== 'ALL') {
      filtered = filtered.filter((a) => a.type === type);
    }
    if (source && source !== 'ALL') {
      filtered = filtered.filter((a) => a.source === source);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) => a.title.toLowerCase().includes(q) || (a.notes && a.notes.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const activities = filtered.slice(startIndex, startIndex + limit);

    return {
      activities,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}

export async function getActivityById(id: string) {
  try {
    const user = await getCurrentUser();
    const activity = await prisma.activity.findFirst({
      where: { id, userId: user.id },
    });

    if (activity) {
      return {
        ...activity,
        stravaActivityId: activity.stravaActivityId ? activity.stravaActivityId.toString() : null,
        gymSets: (activity.gymSets as unknown as import('@/types').GymSet[]) || null,
      };
    }
  } catch (err) {
    console.warn('Database error in getActivityById:', err);
  }

  // Fallback to mock activities if not found in db or db offline
  const { MOCK_ACTIVITIES } = await import('@/lib/mockData');
  return MOCK_ACTIVITIES.find((a) => a.id === id) || null;
}

export async function deleteActivity(id: string) {
  const user = await getCurrentUser();
  try {
    await prisma.activity.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    });
  } catch (err) {
    console.warn('Could not delete activity from DB:', err);
  }

  revalidatePath('/dashboard');
  revalidatePath('/activities');
  return { success: true };
}
