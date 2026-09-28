import { prisma } from '@/lib/db/prisma';

/**
 * Helper untuk mendapatkan atau membuat default user aktif.
 * Dilengkapi fallback jika database PostgreSQL lokal belum aktif.
 */
export async function getCurrentUser() {
  const DEFAULT_EMAIL = 'athlete@antigravity.fit';

  try {
    let user = await prisma.user.findUnique({
      where: { email: DEFAULT_EMAIL },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: DEFAULT_EMAIL,
          name: 'Demo Athlete',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        },
      });
    }

    return user;
  } catch (error) {
    console.warn('Prisma database query fallback (PostgreSQL server belum aktif atau otentikasi gagal):', error);
    return {
      id: 'demo_user',
      email: DEFAULT_EMAIL,
      name: 'Demo Athlete',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
