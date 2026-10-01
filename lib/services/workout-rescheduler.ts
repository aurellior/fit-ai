import { z } from 'zod';
import { ai } from '@/lib/services/gemini';

export const reschedulerResponseSchema = z.object({
  decisionType: z.enum(['MODIFIED_METHOD', 'REDUCED_INTENSITY', 'RESCHEDULE_DAY']),
  newDayOrTime: z.string().min(1),
  newFocus: z.string().min(1),
  newTargetMetric: z.string().min(1),
  coachAdvice: z.string().min(1),
  badge: z.string().min(1),
});

export type RescheduledWorkoutResult = z.infer<typeof reschedulerResponseSchema> & {
  obstacleType: string;
  originalFocus: string;
};

export interface RescheduleRequestPayload {
  dayName: string; // e.g. "Senin", "Kamis", "Sabtu"
  originalFocus: string;
  originalTarget: string;
  obstacleType: string; // e.g. "Hujan / Cuaca Buruk", "Kelelahan / DOMS", "Waktu Terbatas", "Nyeri Sendi"
  customNotes?: string;
}

/**
 * Intelligent Heuristic Fallback when offline or Gemini API is unavailable
 */
export function getHeuristicReschedule(payload: RescheduleRequestPayload): RescheduledWorkoutResult {
  const { dayName, originalFocus, originalTarget, obstacleType, customNotes } = payload;
  const obs = (obstacleType + ' ' + (customNotes || '')).toLowerCase();

  // Rule 1: Hujan / Cuaca Buruk -> Indoor Treadmill atau Core & Mobility
  if (obs.includes('hujan') || obs.includes('cuaca') || obs.includes('badai')) {
    return {
      decisionType: 'MODIFIED_METHOD',
      newDayOrTime: 'Hari Ini (Indoor)',
      newFocus: `Indoor Treadmill: ${originalFocus}`,
      newTargetMetric: originalTarget.includes('km')
        ? `${(parseFloat(originalTarget) * 0.8 || 4).toFixed(1)} km @ Incline 1.0% (Treadmill)`
        : '30-40 menit Treadmill Pace Terkontrol',
      coachAdvice:
        'Hujan lebat berisiko licin dan menurunkan kualitas interval. Alihkan ke treadmill dengan kemiringan (incline) 1.0% untuk mensimulasikan hambatan angin outdoor tanpa risiko terpeleset.',
      badge: 'Indoor Treadmill Shift',
      obstacleType,
      originalFocus,
    };
  }

  // Rule 2: Kelelahan / DOMS / Pegal Ekstrem -> Geser ke hari berikutnya atau Active Recovery
  if (obs.includes('lelah') || obs.includes('pegal') || obs.includes('doms') || obs.includes('capek')) {
    const nextDay = dayName === 'Senin' ? 'Selasa' : dayName === 'Kamis' ? 'Jumat' : 'Minggu';
    return {
      decisionType: 'RESCHEDULE_DAY',
      newDayOrTime: `Geser ke ${nextDay}`,
      newFocus: 'Full Rest & Active Mobility Recovery',
      newTargetMetric: '20 menit Foam Rolling, Dynamic Stretching & Hidrasi Elektrolit',
      coachAdvice:
        'Memaksakan sesi berkualitas saat sistem saraf pusat (CNS) dan serat otot kelelahan hanya memicu overtraining dan micro-tear. Hari ini gunakan untuk tidur berkualitas, pemulihan glikogen, dan eksekusi sesi utama esok hari.',
      badge: 'Recovery Priority',
      obstacleType,
      originalFocus,
    };
  }

  // Rule 3: Waktu Terbatas / Lembur -> Scaled Express Workout
  if (obs.includes('waktu') || obs.includes('sempit') || obs.includes('sibuk') || obs.includes('lembur')) {
    return {
      decisionType: 'REDUCED_INTENSITY',
      newDayOrTime: 'Hari Ini (Express Session)',
      newFocus: `Express Scaled: ${originalFocus}`,
      newTargetMetric: '20-25 Menit • 5 Menit Pemanasan + 15 Menit Main Set Padat',
      coachAdvice:
        'Konsistensi lebih utama daripada kesempurnaan. Pangkas volume menjadi 60% dengan tetap mempertahankan ritme target pace agar stimulus neuromuskular tetap terjaga dalam waktu singkat.',
      badge: 'Express Scaled',
      obstacleType,
      originalFocus,
    };
  }

  // Rule 4: Nyeri Sendi / Otot / Cedera -> Injury Prevention Guard
  if (obs.includes('nyeri') || obs.includes('sendi') || obs.includes('lutut') || obs.includes('sakit') || obs.includes('engkel')) {
    return {
      decisionType: 'MODIFIED_METHOD',
      newDayOrTime: 'Hari Ini (Non-Impact)',
      newFocus: 'Injury Guard: Non-Impact Cross Training',
      newTargetMetric: '30 Menit Sepeda Statis (Low Resistance) atau Renang Santai',
      coachAdvice:
        'Protokol perlindungan cedera diaktifkan. Dilarang melakukan hentakan lari keras saat sendi/tendon mengalami inflamasi. Alihkan ke latihan aerobik tanpa beban impak (non-impact).',
      badge: 'Injury Prevention Guard',
      obstacleType,
      originalFocus,
    };
  }

  // Default Fallback
  return {
    decisionType: 'REDUCED_INTENSITY',
    newDayOrTime: 'Hari Ini (Penyesuaian Adaptif)',
    newFocus: `Easy Recovery: ${originalFocus}`,
    newTargetMetric: '3.0 km - 4.0 km Santai di Zona 2 (Conversational Pace)',
    coachAdvice:
      'Turunkan intensitas latihan ke tingkat pemulihan aktif (Zona 2). Tujuannya adalah melancarkan sirkulasi darah tanpa menambah beban stres berlebih pada tubuh.',
    badge: 'Adaptive Scaled',
    obstacleType,
    originalFocus,
  };
}

/**
 * Main AI Rescheduler using Gemini models with structured JSON mode and fallbacks
 */
export async function rescheduleWorkoutWithAI(
  payload: RescheduleRequestPayload
): Promise<RescheduledWorkoutResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key' || apiKey === 'mock_gemini_api_key') {
    return getHeuristicReschedule(payload);
  }

  const prompt = `Data Sesi Latihan Asli Atlet Hari Ini:
- Hari: ${payload.dayName}
- Fokus Awal: ${payload.originalFocus}
- Target Metrik Awal: ${payload.originalTarget}
- Kendala yang Dihadapi Atlet: "${payload.obstacleType}" ${payload.customNotes ? `(Catatan tambahan: "${payload.customNotes}")` : ''}

Tugas Anda sebagai Pelatih Lari Adaptif (ACSM & IAAF Running Coach):
Analisis kendala tersebut secara taktis dan berikan rekomendasi modifikasi terbaik:
1. Apakah sesi digeser ke hari esok (RESCHEDULE_DAY)?
2. Apakah metodenya diubah ke indoor/cross-training tanpa benturan (MODIFIED_METHOD)?
3. Apakah volume/intensitasnya dipangkas agar aman (REDUCED_INTENSITY)?

Kembalikan HANYA format JSON strictly valid sesuai skema Zod berikut:
{
  "decisionType": "MODIFIED_METHOD" | "REDUCED_INTENSITY" | "RESCHEDULE_DAY",
  "newDayOrTime": "string (misal: 'Hari Ini (Indoor Treadmill)' atau 'Geser ke Selasa Besok')",
  "newFocus": "string (nama menu pengganti yang padat dan jelas)",
  "newTargetMetric": "string (target jarak, durasi, atau set yang spesifik)",
  "coachAdvice": "string (2-3 kalimat tajam penjelasan taktis pelatih)",
  "badge": "string (label ringkas 2-3 kata, misal: 'Treadmill Alternative', 'Express Session', 'Injury Prevention')"
}`;

  const modelsToTry = [
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-2.0-flash',
  ];

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        config: {
          systemInstruction: `Anda adalah Pelatih Lari Adaptif profesional kelas dunia.
Tujuan utama Anda adalah menjaga konsistensi jangka panjang atlet, mencegah cedera, dan memberikan solusi taktis instan yang masuk akal dan memotivasi ketika atlet menghadapi kendala harian.
Kembalikan HANYA format JSON strictly valid tanpa markdown atau teks tambahan.`,
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text?.trim();
      if (!rawText) continue;

      const cleanedJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(cleanedJson);

      const validated = reschedulerResponseSchema.parse({
        decisionType: parsed.decisionType,
        newDayOrTime: String(parsed.newDayOrTime || 'Hari Ini (Adaptif)'),
        newFocus: String(parsed.newFocus || payload.originalFocus),
        newTargetMetric: String(parsed.newTargetMetric || payload.originalTarget),
        coachAdvice: String(parsed.coachAdvice || 'Jalankan sesi pengganti dengan hati-hati.'),
        badge: String(parsed.badge || 'AI Scaled'),
      });

      return {
        ...validated,
        obstacleType: payload.obstacleType,
        originalFocus: payload.originalFocus,
      };
    } catch (err) {
      console.warn(`[AI Rescheduler] Gagal memanggil ${modelName}:`, err);
    }
  }

  console.warn('[AI Rescheduler] Semua model Gemini sibuk, menggunakan heuristic fallback');
  return getHeuristicReschedule(payload);
}
