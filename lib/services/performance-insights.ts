import { ai } from '@/lib/services/gemini';
import { prisma } from '@/lib/db/prisma';
import { ActivityData, WeightLogData, GymSet, CoachPlanData, AiInsightData } from '@/types';

function computeNextWorkoutDay(): { dayName: string; label: string; focus: string; summary: string; targetMetric: string } {
  const day = new Date().getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat

  if (day === 1) {
    return {
      dayName: 'Senin',
      label: 'Hari Ini',
      focus: 'Tempo / Speed Work',
      summary: 'Kunci pace di zona laktat untuk efisiensi kayuhan kaki.',
      targetMetric: '4.5 km • Pace 7:15 - 7:30/km',
    };
  } else if (day === 2 || day === 3) {
    return {
      dayName: 'Kamis',
      label: 'Sesi Terdekat',
      focus: 'Interval / Mid-Week Endurance',
      summary: 'Repetisi 400m cepat untuk mendongkrak VO2 Max.',
      targetMetric: '5x 400m @ Pace 6:45/km (Rest 90s)',
    };
  } else if (day === 4) {
    return {
      dayName: 'Kamis',
      label: 'Hari Ini',
      focus: 'Interval / Mid-Week Endurance',
      summary: 'Repetisi 400m cepat untuk mendongkrak VO2 Max.',
      targetMetric: '5x 400m @ Pace 6:45/km (Rest 90s)',
    };
  } else if (day === 5) {
    return {
      dayName: 'Sabtu',
      label: 'Sesi Terdekat',
      focus: 'Safe Progressive Long Run',
      summary: 'Lari jarak jauh santai di Zone 2 untuk membangun kapasitas aerobik.',
      targetMetric: '6.5 km - 7.0 km • Pace 8:15 - 8:40/km',
    };
  } else if (day === 6) {
    return {
      dayName: 'Sabtu',
      label: 'Hari Ini',
      focus: 'Safe Progressive Long Run',
      summary: 'Lari jarak jauh santai di Zone 2 untuk membangun kapasitas aerobik.',
      targetMetric: '6.5 km - 7.0 km • Pace 8:15 - 8:40/km',
    };
  } else {
    // Sunday (0)
    return {
      dayName: 'Senin',
      label: 'Sesi Terdekat',
      focus: 'Tempo / Speed Work',
      summary: 'Awali pekan dengan latihan kecepatan terukur.',
      targetMetric: '4.5 km • Pace 7:15 - 7:30/km',
    };
  }
}

export function parseCoachPlanFromInsight(insight: {
  id: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  summary: string;
  strengths: string;
  recommendations: string;
  createdAt: Date | string;
}): AiInsightData {
  let coachPlan: CoachPlanData | null = null;

  try {
    if (insight.recommendations && insight.recommendations.trim().startsWith('{')) {
      coachPlan = JSON.parse(insight.recommendations) as CoachPlanData;
    }
  } catch {
    // If not JSON, generate structured plan based on summary
  }

  if (!coachPlan) {
    const nextWk = computeNextWorkoutDay();
    coachPlan = {
      coachGreeting: insight.summary || 'Fokus pada konsistensi jadwal lari rutin Anda minggu ini.',
      intensityVerdict: 'Kurang (Under-training)',
      lastWeekAnalysis: insight.strengths || 'Volume latihan kardio perlu dioptimalkan agar jadwal 3 hari tetap tercapai.',
      nextWorkoutDay: nextWk,
      schedule: {
        monday: {
          dayName: 'Senin',
          focus: 'Tempo / Speed Run',
          targetMetric: '4.5 km • Pace 7:15 - 7:30/km',
          details: '1 km pemanasan santai, 2.5 km tempo run terkontrol pada pace 7:15-7:30, 1 km pendinginan jalan/jogging ringan.',
          intensityBadge: 'High',
        },
        thursday: {
          dayName: 'Kamis',
          focus: 'Interval / Mid-Week Endurance',
          targetMetric: '5x 400m @ Pace 6:45 - 7:00/km',
          details: '1 km warming up, 5 set interval 400m lari cepat dengan jeda istirahat jalan 90 detik antar repetisi, 1 km cooling down.',
          intensityBadge: 'High',
        },
        saturday: {
          dayName: 'Sabtu',
          focus: 'Safe Progressive Long Run',
          targetMetric: '6.5 km - 7.0 km • Pace 8:15 - 8:40/km',
          details: 'Lari jarak jauh murni di Zona 2 (conversational pace). Pertahankan ritme langkah stabil dan jangan terburu-buru.',
          intensityBadge: 'Endurance',
        },
      },
      recoveryAdvice: {
        nutrition: 'Konsumsi pisang atau karbohidrat cepat serap 45 menit sebelum lari, serta minum 300ml air untuk hidrasi optimal.',
        restAndGym: 'Pastikan sesi latihan beban kaki (leg day) tidak dilakukan tepat sebelum lari Sabtu untuk mencegah kelelahan otot.',
        proteinRecommendation: 'Targetkan minimal 1.6g protein per kg berat badan (110 - 130g harian) untuk regenerasi jaringan otot.',
      },
    };
  }

  return {
    ...insight,
    coachPlan,
  };
}

export async function generateWeeklyPerformanceInsight(userId: string): Promise<AiInsightData> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  let activities: ActivityData[] = [];
  let weightLogs: WeightLogData[] = [];

  try {
    const rawActs = await prisma.activity.findMany({
      where: {
        userId,
        startTime: { gte: oneWeekAgo },
      },
      orderBy: { startTime: 'asc' },
    });

    activities = rawActs.map((a) => ({
      ...a,
      stravaActivityId: a.stravaActivityId ? a.stravaActivityId.toString() : null,
      gymSets: (a.gymSets as unknown as GymSet[]) || null,
    }));

    weightLogs = await prisma.weightLog.findMany({
      where: {
        userId,
        loggedAt: { gte: oneWeekAgo },
      },
      orderBy: { loggedAt: 'asc' },
    });
  } catch (dbErr) {
    console.warn('Prisma DB query fallback in insights service:', dbErr);
  }

  const nextWorkout = computeNextWorkoutDay();

  const promptData = {
    fixedRunningDays: ['SENIN (Speed/Tempo)', 'KAMIS (Interval/Endurance)', 'SABTU (Long Run)'],
    nextWorkoutDay: nextWorkout,
    totalWorkoutsLast7Days: activities.length,
    recordedActivities: activities.map((a) => ({
      title: a.title,
      type: a.type,
      source: a.source,
      startTime: a.startTime,
      durationMinutes: Math.round(a.durationSec / 60),
      distanceKm: a.distanceMeters ? (a.distanceMeters / 1000).toFixed(2) : null,
      avgPaceSecPerKm: a.avgPaceSecPerKm,
      gymSets: a.gymSets,
      notes: a.notes,
    })),
    weights: weightLogs.map((w) => ({ weightKg: w.weightKg, date: w.loggedAt })),
  };

  const apiKey = process.env.GEMINI_API_KEY;
  let parsedPlan: CoachPlanData | null = null;

  if (apiKey && apiKey !== 'your_gemini_api_key' && apiKey !== 'mock_gemini_api_key') {
    const systemInstruction = `
      Anda adalah seorang Pelatih Lari Profesional dan Ahli Kebugaran FitAI.
      Pengguna memiliki jadwal lari rutin yang KAKU pada hari: SENIN, KAMIS, dan SABTU.
      
      Aturan Latihan:
      - SENIN: Fokus Speed / Tempo Run (Pace terukur lebih cepat dari easy run).
      - KAMIS: Fokus Interval / Mid-Week Endurance (Repetisi interval misal 400m-600m).
      - SABTU: Fokus Long Run (Jarak jauh aman, pace Zone 2 aerobik, progresif +10-15%).
      
      Gunakan nada bicara pelatih yang TEGAS, SUPORTIF, MEMBAKAR SEMANGAT, dan TIDAK MENGGUNAKAN BAHASA AI GENERIK.
      
      Evaluasi riwayat latihan atlet minggu lalu:
      - Tentukan intensityVerdict: "Kurang (Under-training)" | "Pas (Balanced)" | "Terlalu Berat (Over-training)".
      - Berikan evaluasi jujur dan target menu lari spesifik untuk Senin, Kamis, dan Sabtu berikutnya.
      - Berikan catatan recovery & nutrisi (asupan kalori, protein berdasarkan berat badan, jeda terhadap gym).

      Kembalikan HANYA format JSON valid dengan struktur:
      {
        "coachGreeting": "string (komentar pembuka langsung dari coach, tegas & memotivasi)",
        "intensityVerdict": "Kurang (Under-training)" | "Pas (Balanced)" | "Terlalu Berat (Over-training)",
        "lastWeekAnalysis": "string (analisis sesi minggu lalu, missed runs, pace stabilitas, atau beban gym)",
        "nextWorkoutDay": {
          "dayName": "Senin" | "Kamis" | "Sabtu",
          "label": "Hari Ini" | "Sesi Terdekat",
          "focus": "string",
          "summary": "string ringkas menu lari terdekat",
          "targetMetric": "string (misal: 5.0 km • Pace 7:15/km atau 5x 400m @ Pace 6:45/km)"
        },
        "schedule": {
          "monday": {
            "dayName": "Senin",
            "focus": "Tempo / Speed Run",
            "targetMetric": "string",
            "details": "string panduan pemanasan, main set tempo pace, dan pendinginan",
            "intensityBadge": "High"
          },
          "thursday": {
            "dayName": "Kamis",
            "focus": "Interval / Mid-Week Endurance",
            "targetMetric": "string",
            "details": "string panduan repetisi interval, pace cepat, waktu rest antar set",
            "intensityBadge": "High"
          },
          "saturday": {
            "dayName": "Sabtu",
            "focus": "Safe Progressive Long Run",
            "targetMetric": "string",
            "details": "string panduan jarak aman, batas kenaikan km, dan lari santai di Zona 2",
            "intensityBadge": "Endurance"
          }
        },
        "recoveryAdvice": {
          "nutrition": "string saran karbohidrat/makanan sebelum & sesudah lari",
          "restAndGym": "string saran jeda latihan beban dan istirahat otot kaki",
          "proteinRecommendation": "string anjuran protein harian (gram) sesuai berat badan atlet"
        }
      }
    `;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Berikut data latihan dan berat badan saya:\n${JSON.stringify(promptData, null, 2)}`,
                },
              ],
            },
          ],
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });

        const rawJson = response.text?.trim() || '';
        if (rawJson) {
          parsedPlan = JSON.parse(rawJson);
          break;
        }
      } catch (err) {
        console.warn(`Gemini model ${modelName} attempt failed:`, err);
      }
    }
  }

  // Fallback jika API key tidak ada atau request gagal
  if (!parsedPlan) {
    const runCount = activities.filter((a) => a.type === 'RUN').length;
    const verdict = runCount >= 3 ? 'Pas (Balanced)' : 'Kurang (Under-training)';
    const nextWk = computeNextWorkoutDay();

    parsedPlan = {
      coachGreeting:
        runCount < 3
          ? 'Konsistensi adalah kunci nomor satu. Minggu lalu jadwal rutin 3 hari Anda belum tuntas. Minggu ini kita bayar tuntas di Senin, Kamis, dan Sabtu!'
          : 'Kerja bagus minggu lalu! Anda disiplin menjaga komitmen 3 sesi lari. Mari tingkatkan efisiensi pace minggu ini.',
      intensityVerdict: verdict,
      lastWeekAnalysis: `Tercatat ${runCount} sesi lari dari komitmen 3 hari (Senin, Kamis, Sabtu). Otot aerobik Anda siap untuk ditingkatkan volumenya secara bertahap.`,
      nextWorkoutDay: nextWk,
      schedule: {
        monday: {
          dayName: 'Senin',
          focus: 'Tempo / Speed Run',
          targetMetric: '4.5 km - 5.0 km • Pace 7:15 - 7:30/km',
          details: '1 km pemanasan santai (Pace 8:30), 2.5 km Tempo Run terkunci di Pace 7:15-7:30/km, ditutup 1 km pendinginan jalan aktif.',
          intensityBadge: 'High',
        },
        thursday: {
          dayName: 'Kamis',
          focus: 'Interval / Mid-Week Endurance',
          targetMetric: '5x 400m @ Pace 6:45 - 7:00/km (Rest 90s)',
          details: '1 km jogging ringan dinamis. Masuk ke 5 set lari 400m cepat, ambil rest jalan 90 detik tiap set. Jangan duduk saat jeda rest.',
          intensityBadge: 'High',
        },
        saturday: {
          dayName: 'Sabtu',
          focus: 'Safe Progressive Long Run',
          targetMetric: '6.5 km - 7.0 km • Pace 8:15 - 8:40/km',
          details: 'Lari jarak jauh murni di Zona 2 (conversational pace). Kenaikan jarak +15% aman dari risiko cedera sendi dan tulang kering.',
          intensityBadge: 'Endurance',
        },
      },
      recoveryAdvice: {
        nutrition: 'Konsumsi 1 pisang atau selembar roti gandum 45 menit sebelum lari pagi untuk cadangan glikogen otot, plus 350ml air.',
        restAndGym: 'Hindari latihan beban kaki berat (leg day) di hari Jumat agar paha dan betis segar menyambut Long Run Sabtu.',
        proteinRecommendation: 'Targetkan minimal 110 - 130 gram protein harian untuk pemulihan dan penguatan serabut otot.',
      },
    };
  }

  const rawRecommendations = JSON.stringify(parsedPlan);
  const summary = parsedPlan.coachGreeting;
  const strengths = `${parsedPlan.intensityVerdict}: ${parsedPlan.lastWeekAnalysis}`;

  const insightRecord = {
    id: 'ins_' + Date.now(),
    userId,
    periodStart: oneWeekAgo,
    periodEnd: new Date(),
    summary,
    strengths,
    recommendations: rawRecommendations,
    createdAt: new Date(),
  };

  try {
    const saved = await prisma.aiInsight.create({ data: insightRecord });
    return {
      ...saved,
      coachPlan: parsedPlan,
    };
  } catch (err) {
    console.warn('Prisma create insight fallback:', err);
    return {
      ...insightRecord,
      coachPlan: parsedPlan,
    };
  }
}

