import { ai } from '@/lib/services/gemini';
import { prisma } from '@/lib/db/prisma';
import {
  ActivityData,
  WeightLogData,
  GymSet,
  CoachPlanData,
  AiInsightData,
  CoachWorkoutDay,
  SmartSkipAudit,
  ScheduledDayStatus,
} from '@/types';

interface ScheduleAuditResult {
  smartSkipAudit: SmartSkipAudit;
  nextWorkoutDay: CoachPlanData['nextWorkoutDay'];
  schedule: {
    monday: CoachWorkoutDay;
    thursday: CoachWorkoutDay;
    saturday: CoachWorkoutDay;
  };
}

/**
 * Memeriksa kecocokan jadwal lari (Senin, Kamis, Sabtu) terhadap data aktivitas riil di database.
 * Jika suatu jadwal terlewat, fungsi ini secara cerdas menyesuaikan target lari berikutnya.
 */
function auditScheduleAndAdaptivePlan(activities: ActivityData[]): ScheduleAuditResult {
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat

  // Hitung tanggal Senin di minggu berjalan
  // Jika hari Minggu (0), anggap awal minggu adalah Senin sebelumnya
  const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const mondayDate = new Date(now);
  mondayDate.setDate(now.getDate() + distanceToMonday);
  mondayDate.setHours(0, 0, 0, 0);

  const thursdayDate = new Date(mondayDate);
  thursdayDate.setDate(mondayDate.getDate() + 3);

  const saturdayDate = new Date(mondayDate);
  saturdayDate.setDate(mondayDate.getDate() + 5);

  const runActivities = activities.filter((a) => a.type === 'RUN');

  const findRunOnDate = (targetDate: Date) => {
    return runActivities.find((act) => {
      const actDate = new Date(act.startTime);
      return (
        actDate.getFullYear() === targetDate.getFullYear() &&
        actDate.getMonth() === targetDate.getMonth() &&
        actDate.getDate() === targetDate.getDate()
      );
    });
  };

  const mondayRun = findRunOnDate(mondayDate);
  const thursdayRun = findRunOnDate(thursdayDate);
  const saturdayRun = findRunOnDate(saturdayDate);

  // Status Senin
  let mondayStatus: ScheduledDayStatus = 'upcoming';
  if (mondayRun) {
    mondayStatus = 'completed';
  } else if (currentDayOfWeek === 1) {
    mondayStatus = 'today';
  } else if (currentDayOfWeek > 1 || currentDayOfWeek === 0) {
    mondayStatus = 'skipped';
  }

  // Status Kamis
  let thursdayStatus: ScheduledDayStatus = 'upcoming';
  if (thursdayRun) {
    thursdayStatus = 'completed';
  } else if (currentDayOfWeek === 4) {
    thursdayStatus = 'today';
  } else if (currentDayOfWeek > 4 || currentDayOfWeek === 0) {
    thursdayStatus = 'skipped';
  }

  // Status Sabtu
  let saturdayStatus: ScheduledDayStatus = 'upcoming';
  if (saturdayRun) {
    saturdayStatus = 'completed';
  } else if (currentDayOfWeek === 6) {
    saturdayStatus = 'today';
  } else if (currentDayOfWeek === 0) {
    // Hari Minggu, Sabtu kemarin terlewat jika tidak ada lari
    saturdayStatus = 'skipped';
  }

  const skippedDayNames: string[] = [];
  if (mondayStatus === 'skipped') skippedDayNames.push('Senin');
  if (thursdayStatus === 'skipped') skippedDayNames.push('Kamis');
  if (saturdayStatus === 'skipped') skippedDayNames.push('Sabtu');

  const hasSkippedDays = skippedDayNames.length > 0;

  // Bangun Workout Days dasar
  const mondayWorkout: CoachWorkoutDay = {
    dayName: 'Senin',
    focus: 'Tempo / Speed Run',
    originalFocus: 'Tempo / Speed Run',
    targetMetric: '4.5 km - 5.0 km • Pace 7:15 - 7:30/km',
    details:
      '1 km pemanasan santai (Pace 8:30), 2.5 km Tempo Run terkunci di Pace 7:15-7:30/km, ditutup 1 km pendinginan jalan aktif.',
    intensityBadge: 'High',
    status: mondayStatus,
    isAdjusted: false,
    adjustmentReason: null,
    completedActivity: mondayRun
      ? {
          title: mondayRun.title,
          distanceKm: Number(((mondayRun.distanceMeters || 0) / 1000).toFixed(2)),
          paceFormatted: mondayRun.avgPaceSecPerKm
            ? `${Math.floor(mondayRun.avgPaceSecPerKm / 60)}'${Math.round(mondayRun.avgPaceSecPerKm % 60)
                .toString()
                .padStart(2, '0')}"/km`
            : 'Pace -',
        }
      : null,
  };

  const thursdayWorkout: CoachWorkoutDay = {
    dayName: 'Kamis',
    focus: 'Interval / Mid-Week Endurance',
    originalFocus: 'Interval / Mid-Week Endurance',
    targetMetric: '5x 400m @ Pace 6:45 - 7:00/km (Rest 90s)',
    details:
      '1 km jogging ringan dinamis. 5 set lari 400m cepat dengan istirahat jalan 90 detik tiap set. Jangan duduk saat jeda rest.',
    intensityBadge: 'High',
    status: thursdayStatus,
    isAdjusted: false,
    adjustmentReason: null,
    completedActivity: thursdayRun
      ? {
          title: thursdayRun.title,
          distanceKm: Number(((thursdayRun.distanceMeters || 0) / 1000).toFixed(2)),
          paceFormatted: thursdayRun.avgPaceSecPerKm
            ? `${Math.floor(thursdayRun.avgPaceSecPerKm / 60)}'${Math.round(thursdayRun.avgPaceSecPerKm % 60)
                .toString()
                .padStart(2, '0')}"/km`
            : 'Pace -',
        }
      : null,
  };

  const saturdayWorkout: CoachWorkoutDay = {
    dayName: 'Sabtu',
    focus: 'Safe Progressive Long Run',
    originalFocus: 'Safe Progressive Long Run',
    targetMetric: '6.5 km - 7.0 km • Pace 8:15 - 8:40/km',
    details:
      'Lari jarak jauh murni di Zona 2 (conversational pace). Kenaikan jarak +15% aman dari risiko cedera sendi dan tulang kering.',
    intensityBadge: 'Endurance',
    status: saturdayStatus,
    isAdjusted: false,
    adjustmentReason: null,
    completedActivity: saturdayRun
      ? {
          title: saturdayRun.title,
          distanceKm: Number(((saturdayRun.distanceMeters || 0) / 1000).toFixed(2)),
          paceFormatted: saturdayRun.avgPaceSecPerKm
            ? `${Math.floor(saturdayRun.avgPaceSecPerKm / 60)}'${Math.round(saturdayRun.avgPaceSecPerKm % 60)
                .toString()
                .padStart(2, '0')}"/km`
            : 'Pace -',
        }
      : null,
  };

  let activeAdjustmentNote: string | null = null;

  // ADAPTIVE LOGIC 1: Jika Senin terlewat, dan Kamis belum selesai (upcoming/today)
  if (mondayStatus === 'skipped' && thursdayStatus !== 'completed') {
    thursdayWorkout.isAdjusted = true;
    thursdayWorkout.focus = 'Aerobic Interval & Cruise Tempo (Penyesuaian Adaptif)';
    thursdayWorkout.targetMetric = '5.5 km • 4x 400m Interval + 1.5 km Cruise Tempo';
    thursdayWorkout.details =
      'Penyesuaian karena sesi Senin terlewat: Pemanasan 1.5 km aerobik, 4 repetisi interval 400m cepat (Pace 6:50), dilanjutkan 1.5 km cruise tempo di pace 7:45/km. Mengganti stimulasi aerobik yang hilang secara aman tanpa membuat otot stres berlebihan.';
    thursdayWorkout.adjustmentReason =
      'Sesi Senin terlewat. Kamis diadaptasi menggabungkan interval dengan cruise tempo agar stimulasi ambang laktat tetap tercapai.';
    activeAdjustmentNote =
      'Jadwal Senin terlewat. Rekomendasi Kamis telah disesuaikan dengan penambahan volume aerobik moderat yang aman.';
  }

  // ADAPTIVE LOGIC 2: Jika Kamis terlewat, dan Sabtu belum selesai (upcoming/today)
  if (thursdayStatus === 'skipped' && saturdayStatus !== 'completed') {
    saturdayWorkout.isAdjusted = true;
    saturdayWorkout.focus = 'Progressive Long Run (Penyesuaian Adaptif)';
    saturdayWorkout.targetMetric = '7.0 km • 5 km Zone 2 + 2 km Tempo Finish';
    saturdayWorkout.details =
      'Penyesuaian karena sesi interval Kamis terlewat: Lari 5 km awal di Zone 2 stabil (Pace 8:20/km), lalu tutup 2 km terakhir dengan akselerasi Tempo Finish (Pace 7:30/km). Ini menyerap stimulasi anaerobik yang hilang tanpa memicu risiko cedera sendi.';
    saturdayWorkout.adjustmentReason =
      'Sesi Kamis terlewat. Target Sabtu diadaptasi menjadi Progressive Long Run agar stimulasi kardio dan ambang laktat tetap tercapai proporsional.';
    activeAdjustmentNote =
      'Jadwal Kamis terlewat. Rekomendasi Sabtu disesuaikan menjadi Progressive Long Run dengan akselerasi akhir yang aman.';
  }

  // ADAPTIVE LOGIC 3: Jika Senin DAN Kamis terlewat
  if (mondayStatus === 'skipped' && thursdayStatus === 'skipped' && saturdayStatus !== 'completed') {
    saturdayWorkout.isAdjusted = true;
    saturdayWorkout.focus = 'Reset & Recovery Long Run (Penyesuaian Aman)';
    saturdayWorkout.targetMetric = '6.0 km - 6.5 km • Zona 2 Murni (Pace 8:30/km)';
    saturdayWorkout.details =
      'Peringatan Pelatih: Jangan pernah mencoba "membayar utang" dua sesi yang terlewat sekaligus dengan lari 10+ km! Jaga jarak di 6.5 km Zona 2 murni untuk merefresh kembali ritme biomekanik kaki Anda tanpa risiko cedera tendon.';
    saturdayWorkout.adjustmentReason =
      'Dua sesi terlewat. DILARANG melipatgandakan jarak Sabtu. Lakukan lari santai untuk me-reset kesiapan tubuh menyongsong minggu baru.';
    activeAdjustmentNote =
      'Dua jadwal terlewat minggu ini. Sabtu difokuskan pada lari Zona 2 aman untuk reset ritme tanpa risiko cedera.';
  }

  // Tentukan Next Workout Day
  let nextWorkoutDay: CoachPlanData['nextWorkoutDay'];
  if (currentDayOfWeek === 1) {
    nextWorkoutDay = {
      dayName: 'Senin',
      label: mondayStatus === 'completed' ? 'Tuntas Hari Ini' : 'Hari Ini',
      focus: mondayWorkout.focus,
      summary: mondayWorkout.details,
      targetMetric: mondayWorkout.targetMetric,
      isAdjusted: !!mondayWorkout.isAdjusted,
      adjustmentBadge: mondayWorkout.isAdjusted ? 'Penyesuaian Adaptif' : null,
    };
  } else if (currentDayOfWeek >= 2 && currentDayOfWeek <= 4) {
    nextWorkoutDay = {
      dayName: 'Kamis',
      label: currentDayOfWeek === 4 ? (thursdayStatus === 'completed' ? 'Tuntas Hari Ini' : 'Hari Ini') : 'Sesi Terdekat',
      focus: thursdayWorkout.focus,
      summary: thursdayWorkout.details,
      targetMetric: thursdayWorkout.targetMetric,
      isAdjusted: !!thursdayWorkout.isAdjusted,
      adjustmentBadge: thursdayWorkout.isAdjusted ? 'Penyesuaian (Senin Terlewat)' : null,
    };
  } else if (currentDayOfWeek === 5 || currentDayOfWeek === 6) {
    nextWorkoutDay = {
      dayName: 'Sabtu',
      label: currentDayOfWeek === 6 ? (saturdayStatus === 'completed' ? 'Tuntas Hari Ini' : 'Hari Ini') : 'Sesi Terdekat',
      focus: saturdayWorkout.focus,
      summary: saturdayWorkout.details,
      targetMetric: saturdayWorkout.targetMetric,
      isAdjusted: !!saturdayWorkout.isAdjusted,
      adjustmentBadge: saturdayWorkout.isAdjusted ? 'Penyesuaian Adaptif' : null,
    };
  } else {
    // Sunday (0)
    nextWorkoutDay = {
      dayName: 'Senin',
      label: 'Sesi Terdekat',
      focus: mondayWorkout.focus,
      summary: mondayWorkout.details,
      targetMetric: mondayWorkout.targetMetric,
      isAdjusted: !!mondayWorkout.isAdjusted,
      adjustmentBadge: null,
    };
  }

  const smartSkipAudit: SmartSkipAudit = {
    hasSkippedDays,
    skippedDayNames,
    activeAdjustmentNote,
    auditDetails: {
      monday: {
        status: mondayStatus,
        dateLabel: mondayDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      },
      thursday: {
        status: thursdayStatus,
        dateLabel: thursdayDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      },
      saturday: {
        status: saturdayStatus,
        dateLabel: saturdayDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      },
    },
  };

  return {
    smartSkipAudit,
    nextWorkoutDay,
    schedule: {
      monday: mondayWorkout,
      thursday: thursdayWorkout,
      saturday: saturdayWorkout,
    },
  };
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
    // Fallback if parsing fails
  }

  if (!coachPlan || !coachPlan.smartSkipAudit) {
    const auditRes = auditScheduleAndAdaptivePlan([]);
    coachPlan = {
      coachGreeting: insight.summary || 'Fokus pada konsistensi jadwal lari rutin Anda minggu ini.',
      intensityVerdict: 'Kurang (Under-training)',
      lastWeekAnalysis:
        insight.strengths || 'Volume latihan kardio perlu dioptimalkan agar jadwal 3 hari tetap tercapai.',
      smartSkipAudit: auditRes.smartSkipAudit,
      nextWorkoutDay: auditRes.nextWorkoutDay,
      schedule: auditRes.schedule,
      recoveryAdvice: {
        nutrition:
          'Konsumsi pisang atau karbohidrat cepat serap 45 menit sebelum lari, serta minum 300ml air untuk hidrasi optimal.',
        restAndGym:
          'Pastikan sesi latihan beban kaki (leg day) tidak dilakukan tepat sebelum lari Sabtu untuk mencegah kelelahan otot.',
        proteinRecommendation:
          'Targetkan minimal 1.6g protein per kg berat badan (110 - 130g harian) untuk regenerasi jaringan otot.',
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
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 14); // Ambil 14 hari terakhir untuk audit skip yang lebih akurat

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

  // Hitung audit jadwal dan penyesuaian cerdas (Smart Skip Handling)
  const auditResult = auditScheduleAndAdaptivePlan(activities);

  const promptData = {
    fixedRunningDays: ['SENIN (Speed/Tempo)', 'KAMIS (Interval/Endurance)', 'SABTU (Long Run)'],
    scheduleAudit: auditResult.smartSkipAudit,
    nextWorkoutRecommendation: auditResult.nextWorkoutDay,
    adaptiveWorkouts: auditResult.schedule,
    totalWorkoutsLast14Days: activities.length,
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
      
      Aturan Kecerdasan Adaptif (Smart Skip Handling):
      - Jika ada hari yang terlewat (misal: hari Kamis tidak ada aktivitas lari yang tercatat), Anda WAJIB menyesuaikan (adjust) intensitas atau menu latihan hari berikutnya secara cerdas agar aman dan tidak membebani tubuh.
      - Jika Kamis diskip, sesi Sabtu disesuaikan (misal menjadi Progressive Long Run dengan akselerasi akhir terukur).
      - Jika 2 sesi terlewat, jangan izinkan atlet menggandakan jarak (bahaya cedera), tapi arahkan ke lari reset Zona 2 yang aman.
      
      Gunakan nada bicara pelatih yang TEGAS, SUPORTIF, MEMBAKAR SEMANGAT, dan TIDAK MENGGUNAKAN BAHASA AI GENERIK.

      Kembalikan HANYA format JSON valid dengan struktur:
      {
        "coachGreeting": "string (komentar pembuka langsung dari coach, tegas & memotivasi, sebutkan jika ada hari yang terlewat dan langkah solusinya)",
        "intensityVerdict": "Kurang (Under-training)" | "Pas (Balanced)" | "Terlalu Berat (Over-training)",
        "lastWeekAnalysis": "string (analisis sesi minggu lalu, missed runs, pace stabilitas, atau beban gym)",
        "smartSkipAudit": {
          "hasSkippedDays": boolean,
          "skippedDayNames": string[],
          "activeAdjustmentNote": "string atau null",
          "auditDetails": {
            "monday": { "status": "completed" | "skipped" | "upcoming" | "today", "dateLabel": "string" },
            "thursday": { "status": "completed" | "skipped" | "upcoming" | "today", "dateLabel": "string" },
            "saturday": { "status": "completed" | "skipped" | "upcoming" | "today", "dateLabel": "string" }
          }
        },
        "nextWorkoutDay": {
          "dayName": "Senin" | "Kamis" | "Sabtu",
          "label": "Hari Ini" | "Sesi Terdekat",
          "focus": "string",
          "summary": "string ringkas menu lari terdekat",
          "targetMetric": "string",
          "isAdjusted": boolean,
          "adjustmentBadge": "string atau null"
        },
        "schedule": {
          "monday": {
            "dayName": "Senin",
            "focus": "Tempo / Speed Run",
            "targetMetric": "string",
            "details": "string panduan pemanasan, main set tempo pace, dan pendinginan",
            "intensityBadge": "High",
            "status": "completed" | "skipped" | "upcoming" | "today",
            "isAdjusted": boolean,
            "adjustmentReason": "string atau null"
          },
          "thursday": {
            "dayName": "Kamis",
            "focus": "Interval / Mid-Week Endurance",
            "targetMetric": "string",
            "details": "string panduan repetisi interval, pace cepat, waktu rest antar set",
            "intensityBadge": "High",
            "status": "completed" | "skipped" | "upcoming" | "today",
            "isAdjusted": boolean,
            "adjustmentReason": "string atau null"
          },
          "saturday": {
            "dayName": "Sabtu",
            "focus": "Safe Progressive Long Run",
            "targetMetric": "string",
            "details": "string panduan jarak aman, batas kenaikan km, dan lari santai di Zona 2",
            "intensityBadge": "Endurance",
            "status": "completed" | "skipped" | "upcoming" | "today",
            "isAdjusted": boolean,
            "adjustmentReason": "string atau null"
          }
        },
        "recoveryAdvice": {
          "nutrition": "string saran karbohidrat/makanan sebelum & sesudah lari",
          "restAndGym": "string saran jeda latihan beban dan istirahat otot kaki",
          "proteinRecommendation": "string anjuran protein harian (gram) sesuai berat badan atlet"
        }
      }
    `;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];
    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Berikut data latihan, berat badan, dan status kepatuhan jadwal saya:\n${JSON.stringify(
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

        const rawJson = response.text?.trim() || '';
        if (rawJson) {
          const cleanedJson = rawJson.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
          const geminiPlan = JSON.parse(cleanedJson);
          // Pastikan audit details terisi dengan benar
          geminiPlan.smartSkipAudit = {
            ...auditResult.smartSkipAudit,
            ...(geminiPlan.smartSkipAudit || {}),
          };
          parsedPlan = geminiPlan;
          break;
        }
      } catch (err) {
        console.warn(`Gemini model ${modelName} attempt failed in smart skip:`, err);
      }
    }
  }

  // Fallback jika API key tidak ada atau request gagal
  if (!parsedPlan) {
    const runCount = activities.filter((a) => a.type === 'RUN').length;
    const verdict = runCount >= 3 ? 'Pas (Balanced)' : 'Kurang (Under-training)';

    let greeting = '';
    if (auditResult.smartSkipAudit.hasSkippedDays) {
      const skippedStr = auditResult.smartSkipAudit.skippedDayNames.join(', ');
      greeting = `Perhatian atlet: Sesi ${skippedStr} terlewat minggu ini. Jangan cemas atau merasa bersalah, sistem pelatih kami telah otomatis menyesuaikan target lari berikutnya agar Anda tetap berkembang tanpa risiko cedera.`;
    } else {
      greeting =
        'Kerja bagus! Anda disiplin menjaga jadwal rutin. Pertahankan konsistensi ini untuk mengunci hasil latihan maksimal.';
    }

    parsedPlan = {
      coachGreeting: greeting,
      intensityVerdict: verdict,
      lastWeekAnalysis: `Tercatat ${runCount} sesi lari dalam rentang observasi. ${
        auditResult.smartSkipAudit.activeAdjustmentNote || 'Ritme jadwal lari 3 hari sedang berjalan sesuai rencana.'
      }`,
      smartSkipAudit: auditResult.smartSkipAudit,
      nextWorkoutDay: auditResult.nextWorkoutDay,
      schedule: auditResult.schedule,
      recoveryAdvice: {
        nutrition:
          'Konsumsi 1 pisang atau selembar roti gandum 45 menit sebelum lari pagi untuk cadangan glikogen otot, plus 350ml air putih.',
        restAndGym:
          'Hindari latihan beban kaki berat (leg day) di hari Jumat agar paha dan betis segar menyambut Long Run Sabtu.',
        proteinRecommendation:
          'Targetkan minimal 110 - 130 gram protein harian untuk pemulihan dan penguatan serabut otot pasca latihan.',
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
