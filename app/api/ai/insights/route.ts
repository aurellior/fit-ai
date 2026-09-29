import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  generateWeeklyPerformanceInsight,
  parseCoachPlanFromInsight,
} from '@/lib/services/performance-insights';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const latestInsight = await prisma.aiInsight.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestInsight) {
      return NextResponse.json({ success: true, data: null });
    }

    const parsed = parseCoachPlanFromInsight(latestInsight);
    return NextResponse.json({ success: true, data: parsed });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    const insight = await generateWeeklyPerformanceInsight(user.id);

    return NextResponse.json({
      success: true,
      message: 'Analisis performa mingguan Gemini AI berhasil dibuat.',
      data: insight,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Gagal menghasilkan insight AI';
    console.error('Error generating AI insight:', error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
