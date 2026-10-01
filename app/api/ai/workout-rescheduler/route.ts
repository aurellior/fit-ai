import { NextRequest, NextResponse } from 'next/server';
import { rescheduleWorkoutWithAI } from '@/lib/services/workout-rescheduler';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dayName, originalFocus, originalTarget, obstacleType, customNotes } = body || {};

    if (!dayName || !originalFocus || !obstacleType) {
      return NextResponse.json(
        { error: 'Informasi sesi latihan dan kendala wajib diisi' },
        { status: 400 }
      );
    }

    const result = await rescheduleWorkoutWithAI({
      dayName: String(dayName),
      originalFocus: String(originalFocus),
      originalTarget: String(originalTarget || ''),
      obstacleType: String(obstacleType),
      customNotes: customNotes ? String(customNotes) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Gagal memproses rekomendasi reschedule';
    console.error('[API /api/ai/workout-rescheduler] Error:', error);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
