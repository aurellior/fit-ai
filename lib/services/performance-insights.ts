import { ai } from '@/lib/services/gemini';
import { prisma } from '@/lib/db/prisma';

export async function generateWeeklyPerformanceInsight(userId: string) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // 1. Ambil data aktivitas 7 hari terakhir
  const activities = await prisma.activity.findMany({
    where: {
      userId,
      startTime: { gte: oneWeekAgo },
    },
    orderBy: { startTime: 'asc' },
  });

  // 2. Ambil data berat badan 7 hari terakhir
  const weightLogs = await prisma.weightLog.findMany({
    where: {
      userId,
      loggedAt: { gte: oneWeekAgo },
    },
    orderBy: { loggedAt: 'asc' },
  });

  const promptData = {
    totalWorkouts: activities.length,
    activities: activities.map((a) => ({
      title: a.title,
      type: a.type,
      source: a.source,
      durationMinutes: Math.round(a.durationSec / 60),
      distanceKm: a.distanceMeters ? (a.distanceMeters / 1000).toFixed(2) : null,
      gymSets: a.gymSets,
      notes: a.notes,
    })),
    weights: weightLogs.map((w) => ({ weightKg: w.weightKg, date: w.loggedAt })),
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key' || apiKey === 'mock_gemini_api_key') {
    // Mock fallback jika user belum mengisi API key di .env
    const fallbackInsight = await prisma.aiInsight.create({
      data: {
        userId,
        periodStart: oneWeekAgo,
        periodEnd: new Date(),
        summary: `Tercatat ${activities.length} sesi latihan selama seminggu terakhir. Konsistensi latihan sudah terlihat baik pada kardio dan latihan beban.`,
        strengths: 'Kemampuan menjaga jadwal latihan rutin dan variasi antara olahraga kardio serta pembentukan otot.',
        recommendations: 'Pastikan hidrasi tercukupi dan berikan 1 hari istirahat aktif untuk pemulihan optimal. Masukkan GEMINI_API_KEY di file .env untuk analisis AI otomatis dari Gemini.',
      },
    });
    return fallbackInsight;
  }

  const systemInstruction = `
    Anda adalah seorang Sports Scientist dan Pelatih Kebugaran Profesional.
    Tugas Anda adalah mengevaluasi data latihan atlet selama 7 hari terakhir.
    Format respon strictly dalam JSON valid dengan key:
    {
      "summary": "Ringkasan performa keseluruhan (1-2 paragraf)",
      "strengths": "Poin-poin positif dan progres yang dicapai",
      "recommendations": "Saran pemulihan, intensitas, atau variasi latihan minggu depan"
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Berikut adalah ringkasan data sesi latihan dan berat badan saya dalam 7 hari terakhir:\n${JSON.stringify(
              promptData,
              null,
              2
            )}`,
          },
        ],
      },
    ],
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
    },
  });

  const rawJson = response.text?.trim() || '{}';
  let parsed: { summary: string; strengths: string; recommendations: string };

  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    console.error('Failed to parse Gemini JSON response:', err);
    parsed = {
      summary: response.text || 'Analisis berhasil dibuat.',
      strengths: 'Konsistensi latihan yang baik.',
      recommendations: 'Tingkatkan intensitas secara bertahap dan jaga nutrisi harian.',
    };
  }

  const insight = await prisma.aiInsight.create({
    data: {
      userId,
      periodStart: oneWeekAgo,
      periodEnd: new Date(),
      summary: parsed.summary || 'Ringkasan performa mingguan.',
      strengths: parsed.strengths || 'Konsistensi aktif terjaga.',
      recommendations: parsed.recommendations || 'Pertahankan ritme latihan.',
    },
  });

  return insight;
}
