import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { logDailyStepsAction } from '@/actions/steps';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');

    if (dateStr) {
      const stepLog = await prisma.stepLog.findUnique({
        where: {
          userId_dateStr: {
            userId: user.id,
            dateStr,
          },
        },
      });
      return NextResponse.json({ success: true, data: stepLog });
    }

    const stepLogs = await prisma.stepLog.findMany({
      where: { userId: user.id },
      orderBy: { dateStr: 'desc' },
      take: 30,
    });
    return NextResponse.json({ success: true, data: stepLogs });
  } catch (error) {
    console.error('Error fetching step logs:', error);
    return NextResponse.json({ error: 'Gagal mengambil data langkah harian' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { dateStr, stepCount, source, notes } = body;

    if (!dateStr || typeof stepCount !== 'number') {
      return NextResponse.json(
        { error: 'dateStr dan stepCount (angka) wajib disertakan' },
        { status: 400 }
      );
    }

    const result = await logDailyStepsAction({
      dateStr,
      stepCount,
      source: source || 'MANUAL',
      notes,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Error saving step log:', error);
    return NextResponse.json({ error: 'Gagal menyimpan data langkah harian' }, { status: 500 });
  }
}
