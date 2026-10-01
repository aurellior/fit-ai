import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDailyNutritionAudit, getNutritionAuditHistory } from '@/lib/services/nutrition-audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const history = searchParams.get('history');

    if (history) {
      const days = parseInt(history, 10) || 7;
      const historyData = await getNutritionAuditHistory({ userId: user.id, days });
      return NextResponse.json({ success: true, data: historyData });
    }

    const audit = await getDailyNutritionAudit({
      userId: user.id,
      targetDate: date ? new Date(date) : new Date(),
      forceAiRefresh: false,
    });

    return NextResponse.json({ success: true, data: audit });
  } catch (error) {
    console.error('Error fetching nutrition audit:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data audit nutrisi harian' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json().catch(() => ({}));
    const { date, forceRefresh, steps, stepSource, notes } = body;

    if (typeof steps === 'number' && !isNaN(steps)) {
      const { logDailyStepsAction } = await import('@/actions/steps');
      const target = date ? new Date(date) : new Date();
      const y = target.getFullYear();
      const m = String(target.getMonth() + 1).padStart(2, '0');
      const d = String(target.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      await logDailyStepsAction({
        dateStr,
        stepCount: steps,
        source: stepSource || 'MANUAL',
        notes,
      });
    }

    const audit = await getDailyNutritionAudit({
      userId: user.id,
      targetDate: date ? new Date(date) : new Date(),
      forceAiRefresh: forceRefresh !== false,
    });

    return NextResponse.json({ success: true, data: audit });
  } catch (error) {
    console.error('Error refreshing nutrition audit:', error);
    return NextResponse.json(
      { error: 'Gagal mengevaluasi ulang audit nutrisi dengan AI' },
      { status: 500 }
    );
  }
}
