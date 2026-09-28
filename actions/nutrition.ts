'use server';

import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getFoodLogs(limit = 10) {
  const user = await getCurrentUser();
  return prisma.foodLog.findMany({
    where: { userId: user.id },
    orderBy: { loggedAt: 'desc' },
    take: limit,
  });
}

export async function deleteFoodLog(id: string) {
  const user = await getCurrentUser();
  await prisma.foodLog.deleteMany({
    where: {
      id,
      userId: user.id,
    },
  });

  revalidatePath('/dashboard');
  return { success: true };
}
