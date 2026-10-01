import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { parseFoodTextWithAI, saveFoodLogFromNutrition } from '@/lib/services/food-text-parser';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const description = typeof body?.description === 'string' ? body.description.trim() : '';

    if (!description) {
      return NextResponse.json(
        { error: 'Deskripsi makanan tidak boleh kosong' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();

    // 1. Ekstraksi gizi dengan Gemini AI + validasi Zod
    const nutrition = await parseFoodTextWithAI(description);

    // 2. Simpan ke database PostgreSQL
    const savedLog = await saveFoodLogFromNutrition(user.id, nutrition);

    // 3. Revalidasi halaman agar Dashboard & Nutrition langsung sinkron
    revalidatePath('/nutrition');
    revalidatePath('/dashboard');
    revalidatePath('/activities');

    return NextResponse.json({
      success: true,
      data: savedLog,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Gagal memproses catatan teks makanan dengan AI';
    console.error('[API /api/ai/food-text-log] Error:', error);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
