'use server';

import { z } from 'zod';
import { db } from '@/lib/db/prisma';
import { ai } from '@/lib/services/gemini';
import { Type, Schema } from '@google/genai';
import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types';

const rescheduleInputSchema = z.object({
  userId: z.string().min(1, 'User ID wajib disertakan'),
  originalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  activityType: z.string().min(1, 'Jenis aktivitas wajib disertakan'),
  originalWorkoutPlan: z.string().min(1, 'Rencana latihan wajib disertakan'),
  userReason: z.string().min(1, 'Alasan kendala wajib disertakan'),
});

export type RescheduleInput = z.infer<typeof rescheduleInputSchema>;

export interface RescheduleOutput {
  adjustedAction: string;
  newScheduleDateOffset: number;
  coachAdvice: string;
  safeToTrain: boolean;
}

export async function processAndSaveWorkoutReschedule(
  rawInput: unknown
): Promise<ActionResult<RescheduleOutput>> {
  const parsed = rescheduleInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Data input reschedule tidak valid',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = parsed.data;
  try {
    // 1. Prompt terstruktur untuk Gemini AI sebagai Sports Scientist & Adaptive Running Coach
    const prompt = `
Bertindaklah sebagai Sports Scientist dan Adaptive Running Coach profesional untuk sistem FitPulse AI.
Atlet/pengguna melaporkan kendala berikut pada jadwal latihan hari ini:
- Kendala / Alasan: "${input.userReason}"
- Jenis Latihan Awal: ${input.activityType}
- Rencana Volume/Durasi: ${input.originalWorkoutPlan}

Tugas Anda:
1. Analisis apakah sesi lari ini harus digeser ke hari berikutnya (offset hari: 0 untuk tetap hari ini dengan modifikasi indoor/intensitas, 1 untuk geser besok, dst.) atau cukup dimodifikasi metodenya.
2. Buat instruksi taktis pencegahan cedera yang spesifik untuk pelari endurance.
3. Output WAJIB berupa JSON sesuai skema yang ditentukan.
`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        adjustedAction: { type: Type.STRING },
        newScheduleDateOffset: { type: Type.INTEGER },
        coachAdvice: { type: Type.STRING },
        safeToTrain: { type: Type.BOOLEAN },
      },
      required: ['adjustedAction', 'newScheduleDateOffset', 'coachAdvice', 'safeToTrain'],
    };

    let resultJson: RescheduleOutput;

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key' && apiKey !== 'mock_gemini_api_key') {
      try {
        // 2. Eksekusi Gemini AI
        const aiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
          },
        });

        const rawText = aiResponse.text?.trim() || '{}';
        resultJson = JSON.parse(rawText);
      } catch (geminiErr) {
        console.warn('Gemini 2.5 flash call failed, running heuristic fallback:', geminiErr);
        resultJson = getSportsScientistHeuristic(input);
      }
    } else {
      resultJson = getSportsScientistHeuristic(input);
    }

    // 3. Hitung tanggal baru berdasarkan offset hari dari Gemini
    const origDateObj = new Date(input.originalDate);
    const newDateObj = new Date(origDateObj);
    newDateObj.setDate(origDateObj.getDate() + (resultJson.newScheduleDateOffset || 0));

    // 4. Simpan permanen ke Database PostgreSQL menggunakan upsert (mencegah duplikat di hari yang sama)
    await db.workoutReschedule.upsert({
      where: {
        userId_originalDate: {
          userId: input.userId,
          originalDate: origDateObj,
        },
      },
      update: {
        rescheduledDate: newDateObj,
        activityType: input.activityType,
        reason: input.userReason,
        aiRecommendation: JSON.stringify(resultJson),
      },
      create: {
        userId: input.userId,
        originalDate: origDateObj,
        rescheduledDate: newDateObj,
        activityType: input.activityType,
        reason: input.userReason,
        aiRecommendation: JSON.stringify(resultJson),
      },
    });

    // 5. Revalidasi cache Next.js agar data langsung termuat secara persisten saat di-refresh
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/ai-coach');

    return { success: true, data: resultJson };
  } catch (error) {
    console.error('Gagal memproses reschedule:', error);
    return { success: false, error: 'Terjadi kesalahan sistem saat reschedule.' };
  }
}

/**
 * Heuristic Sports Scientist fallback for robust zero-failure execution
 */
function getSportsScientistHeuristic(input: RescheduleInput): RescheduleOutput {
  const reason = (input.userReason || '').toLowerCase();

  if (reason.includes('hujan') || reason.includes('cuaca') || reason.includes('badai')) {
    return {
      adjustedAction: 'Alihkan ke Treadmill Indoor',
      newScheduleDateOffset: 0,
      coachAdvice:
        'Hujan berisiko menyebabkan slip dan hipotermia otot. Lanjutkan menu di atas treadmill dengan elevasi/incline 1.0% untuk menyamai resistensi lari jalan raya tanpa benturan licin.',
      safeToTrain: true,
    };
  }

  if (reason.includes('lelah') || reason.includes('doms') || reason.includes('pegal') || reason.includes('capek')) {
    return {
      adjustedAction: 'Geser Sesi ke Hari Besok (Prioritas Pemulihan)',
      newScheduleDateOffset: 1,
      coachAdvice:
        'Sistem neuromuskular dan cadangan glikogen sedang deplesi. Memaksakan lari intensitas tinggi saat DOMS meningkatkan risiko cedera hamstring dan tendon achilles hingga 300%. Lakukan hidrasi elektrolit dan tidur minimal 8 jam malam ini.',
      safeToTrain: false,
    };
  }

  if (reason.includes('nyeri') || reason.includes('sendi') || reason.includes('lutut') || reason.includes('sakit')) {
    return {
      adjustedAction: 'Protokol Perlindungan Cedera: Istirahat Total & Kompres Dingin',
      newScheduleDateOffset: 2,
      coachAdvice:
        'Gejala inflamasi akut terdeteksi pada persendian. Hentikan seluruh aktivitas impak tinggi seketika. Fokuskan pada elevasi kaki, kompres es selama 15 menit, dan konsumsi makanan anti-inflamasi tinggi omega-3.',
      safeToTrain: false,
    };
  }

  if (reason.includes('waktu') || reason.includes('sibuk') || reason.includes('lembur')) {
    return {
      adjustedAction: 'Modifikasi Sesi Singkat (Express Scaled 25 Menit)',
      newScheduleDateOffset: 0,
      coachAdvice:
        'Lebih baik mempertahankan kontinuitas neuromuskular dengan volume yang dipangkas 50% daripada tidak berlari sama sekali. Lakukan 5 menit pemanasan dinamis, 15 menit lari ritmis Zona 3, dan 5 menit pendinginan.',
      safeToTrain: true,
    };
  }

  return {
    adjustedAction: 'Modifikasi Lari Pemulihan Zona 2 Terkontrol',
    newScheduleDateOffset: 0,
    coachAdvice:
      'Turunkan beban kerja jantung dan otot ke Zona 2 (pernapasan hidung/conversational pace). Fokus pada kadensi kaki yang ringan (170-180 spm) untuk menjaga elastisitas tendon tanpa akumulasi laktat.',
    safeToTrain: true,
  };
}
