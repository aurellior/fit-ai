import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { syncStravaActivities } from '@/lib/services/strava';

export async function POST() {
  try {
    const user = await getCurrentUser();
    const result = await syncStravaActivities(user.id);

    return NextResponse.json({
      success: true,
      message: `Berhasil menyinkronkan ${result.syncedCount} aktivitas dari Strava.`,
      syncedCount: result.syncedCount,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Gagal sinkronisasi Strava';
    console.error('Strava manual sync error:', error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
