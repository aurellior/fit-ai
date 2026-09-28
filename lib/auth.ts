import { prisma } from '@/lib/db/prisma';

/**
 * Helper untuk mendapatkan atau membuat default user aktif.
 * Dalam aplikasi nyata, ini dapat dihubungkan ke session NextAuth / Supabase Auth / Clerk.
 */
export async function getCurrentUser() {
  const DEFAULT_EMAIL = 'athlete@antigravity.fit';

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
}
