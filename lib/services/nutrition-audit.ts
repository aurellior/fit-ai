import { ai } from '@/lib/services/gemini';
import { prisma } from '@/lib/db/prisma';
import { DailyNutritionAuditData, EnergyBalanceStatus } from '@/types';
import { calculateIsolatedEnergyExpenditure, estimateWorkoutSteps } from '@/lib/services/step-isolation';

import {
  getWibDateString,
  getWibDayIndex,
  getWibDayName,
  formatWibDateIndonesian,
  getWibStartAndEndOfDay,
  isSameWibDate,
} from '@/lib/timezone';

interface ScheduleMeta {
  dayName: string;
  dayScheduleFocus: string;
  isTrainingDay: boolean;
}

function getScheduleMeta(date: Date | string): ScheduleMeta {
  const dayIndex = getWibDayIndex(date);
  const dayName = getWibDayName(date);

  switch (dayIndex) {
    case 1:
      return { dayName, dayScheduleFocus: 'Tempo / Speed Run (Jadwal Kunci)', isTrainingDay: true };
    case 4:
      return { dayName, dayScheduleFocus: 'Interval Training VO2Max (Jadwal Kunci)', isTrainingDay: true };
    case 6:
      return { dayName, dayScheduleFocus: 'Progressive Long Run (Jadwal Kunci)', isTrainingDay: true };
    case 2:
      return { dayName, dayScheduleFocus: 'Gym Hypertrophy & Cross Training', isTrainingDay: false };
    case 0:
      return { dayName, dayScheduleFocus: 'Pemulihan Otot & Easy Walk', isTrainingDay: false };
    default:
      return { dayName, dayScheduleFocus: 'Active Recovery / Rest Day', isTrainingDay: false };
  }
}

/**
 * Evaluator heuristik deterministik jika Gemini API offline, limit tercapai, atau menggunakan mock key.
 * Cerdas memperhitungkan pemisahan kalori Strava vs NEAT langkah harian untuk mencegah distorsi.
 */
function generateHeuristicEvaluation({
  dayScheduleFocus,
  isTrainingDay,
  caloriesIn,
  caloriesOut = 0,
  netCalories,
  status,
  totalProtein,
  targetProteinG,
  totalCarbs,
  totalDailySteps = 0,
  workoutStepsAbsorbed = 0,
  pureNeatSteps = 0,
  neatCalories = 0,
  doubleCountingPrevented = false,
  deduplicatedCaloriesSaved = 0,
}: {
  dayScheduleFocus: string;
  isTrainingDay: boolean;
  caloriesIn: number;
  caloriesOut?: number;
  netCalories: number;
  status: EnergyBalanceStatus;
  totalProtein: number;
  targetProteinG: number;
  totalCarbs: number;
  totalDailySteps?: number;
  workoutStepsAbsorbed?: number;
  pureNeatSteps?: number;
  neatCalories?: number;
  doubleCountingPrevented?: boolean;
  deduplicatedCaloriesSaved?: number;
}): { evaluationMessage: string; proteinStatus: string; actionableTip: string } {
  const proteinGap = targetProteinG - totalProtein;

  let evaluationMessage = '';
  if (caloriesIn === 0) {
    evaluationMessage = `Belum ada log makanan tercatat untuk hari ini (kebutuhan pengeluaran: ${caloriesOut} kkal). Pastikan Anda mengunggah menu makanan untuk memantau asupan energi terhadap jadwal ${dayScheduleFocus}.`;
  } else if (isTrainingDay) {
    if (doubleCountingPrevented && deduplicatedCaloriesSaved > 0) {
      if (status === 'Defisit') {
        evaluationMessage = `Defisit energi terukur ${Math.abs(netCalories)} kkal pada hari ${dayScheduleFocus}. Sistem mengisolasi ${workoutStepsAbsorbed.toLocaleString('id-ID')} langkah lari Strava, menyisakan ${pureNeatSteps.toLocaleString('id-ID')} langkah NEAT murni (+${neatCalories} kkal) dan menyaring duplikasi ${deduplicatedCaloriesSaved} kkal agar defisit tidak dilebih-lebihkan.`;
      } else if (status === 'Surplus') {
        evaluationMessage = `Surplus terkendali (+${netCalories} kkal) mendukung resintesis glikogen optimal pasca ${dayScheduleFocus}. Kalori langkah lari Strava (${workoutStepsAbsorbed.toLocaleString('id-ID')} langkah) telah terintegrasi presisi tanpa pembengkakan ganda.`;
      } else {
        evaluationMessage = `Keseimbangan energi sangat presisi untuk intensitas ${dayScheduleFocus}. Porsi kalori lari Strava dan ${pureNeatSteps.toLocaleString('id-ID')} langkah NEAT harian terisolasi akurat sehingga cadangan energi tetap stabil.`;
      }
    } else {
      if (status === 'Defisit') {
        evaluationMessage = `Energi harian berada dalam defisit ${Math.abs(netCalories)} kkal di hari latihan kunci (${dayScheduleFocus}). Waspadai deplesi glikogen jika defisit melebihi 400 kkal sebelum sesi lari berikutnya.`;
      } else if (status === 'Surplus') {
        evaluationMessage = `Asupan energi berada dalam surplus terkendali (+${netCalories} kkal), sangat baik untuk memaksimalkan resintesis glikogen otot pasca ${dayScheduleFocus}.`;
      } else {
        evaluationMessage = `Energy balance sangat seimbang untuk mendukung intensitas ${dayScheduleFocus}. Pasokan energi pas untuk performa dan tidak membebani cadangan lemak tubuh.`;
      }
    }
  } else {
    // Rest day / recovery day
    if (totalDailySteps > 8000 && pureNeatSteps > 6000) {
      evaluationMessage = `Aktivitas harian aktif (${pureNeatSteps.toLocaleString('id-ID')} langkah NEAT murni, +${neatCalories} kkal) pada hari pemulihan. Net kalori tercatat ${netCalories > 0 ? `+${netCalories}` : netCalories} kkal (${status}).`;
    } else if (status === 'Surplus' && netCalories > 300) {
      evaluationMessage = `Asupan kalori berada dalam surplus (+${netCalories} kkal) pada hari pemulihan/istirahat. Pertahankan net kalori mendekati balanced agar komposisi tubuh atlet tetap ramping.`;
    } else if (status === 'Defisit') {
      evaluationMessage = `Defisit ringan (${Math.abs(netCalories)} kkal) pada hari istirahat aman untuk menjaga lean body mass selama mikronutrisi tetap optimal.`;
    } else {
      evaluationMessage = `Energy balance harian sangat terukur pada hari pemulihan. Pengeluaran energi basal terpenuhi dengan baik tanpa penumpukan kalori berlebih.`;
    }
  }

  let proteinStatus = '';
  if (totalProtein === 0) {
    proteinStatus = `Belum ada asupan protein tercatat. Target harian pelari: ${targetProteinG}g (1.6g/kg berat badan).`;
  } else if (proteinGap <= 0) {
    proteinStatus = `Target protein terpenuhi optimal (${totalProtein}g / ${targetProteinG}g). Sangat efektif mempercepat pemulihan mikrorobekan serat otot (muscle protein synthesis).`;
  } else if (proteinGap <= 25) {
    proteinStatus = `Asupan protein mencapai ${totalProtein}g (mendekati target ${targetProteinG}g). Tambahkan 1 porsi cemilan tinggi protein (telur, susu kedelai, atau yogurt) untuk menutup kekurangan ${proteinGap}g.`;
  } else {
    proteinStatus = `Asupan protein masih kurang ${proteinGap}g dari target ideal ${targetProteinG}g. Prioritaskan lauk hewani/nabati padat protein pada waktu makan berikutnya.`;
  }

  let actionableTip = '';
  if (doubleCountingPrevented && deduplicatedCaloriesSaved > 0) {
    actionableTip = `Lonjakan langkah hari ini sebagian besar terserap oleh sesi lari Strava. Jangan menambah porsi makan berlebih berdasarkan total langkah jam tangan agar surplus tetap terkendali.`;
  } else if (isTrainingDay && totalCarbs < 150 && caloriesIn > 0) {
    actionableTip = 'Tingkatkan asupan karbohidrat kompleks (nasi merah/oats/ubi) 2 jam sebelum atau segera setelah lari untuk mengisi kembali glikogen hati & otot.';
  } else if (proteinGap > 0) {
    actionableTip = 'Bagi asupan protein merata per 3-4 jam (~25-35g per porsi makan) untuk penyerapan asam amino yang maksimal.';
  } else {
    actionableTip = 'Pastikan hidrasi tercukupi minimal 2.5 - 3 liter air per hari, terutama setelah sesi latihan keringat tinggi.';
  }

  return { evaluationMessage, proteinStatus, actionableTip };
}

export async function getDailyNutritionAudit({
  userId,
  targetDate,
  forceAiRefresh = false,
}: {
  userId: string;
  targetDate?: Date | string;
  forceAiRefresh?: boolean;
}): Promise<DailyNutritionAuditData> {
  const { startOfDay, endOfDay, dateStr } = getWibStartAndEndOfDay(targetDate || new Date());
  const dateFormatted = formatWibDateIndonesian(targetDate || new Date());
  const { dayName, dayScheduleFocus, isTrainingDay } = getScheduleMeta(dateStr);

  let foodLogsData: Array<{ calories: number; proteinG: number; carbsG: number; fatG: number; foodName: string }> = [];
  let activitiesData: Array<{
    id?: string;
    title: string;
    type: string;
    source?: string;
    stravaActivityId?: string | bigint | null;
    calories?: number | null;
    distanceMeters?: number | null;
    durationSec: number;
  }> = [];
  let userWeightKg = 68;
  let loggedDailySteps: number | null = null;
  let stepSource: string | undefined = undefined;

  try {
    const [foodLogs, activities, latestWeight, stepLog] = await Promise.all([
      prisma.foodLog.findMany({
        where: {
          userId,
          loggedAt: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { loggedAt: 'desc' },
      }),
      prisma.activity.findMany({
        where: {
          userId,
          startTime: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { startTime: 'desc' },
      }),
      prisma.weightLog.findFirst({
        where: { userId },
        orderBy: { loggedAt: 'desc' },
      }),
      prisma.stepLog.findUnique({
        where: {
          userId_dateStr: {
            userId,
            dateStr,
          },
        },
      }),
    ]);

    foodLogsData = foodLogs;
    activitiesData = activities;
    if (latestWeight?.weightKg) {
      userWeightKg = latestWeight.weightKg;
    }
    if (stepLog) {
      loggedDailySteps = stepLog.stepCount;
      stepSource = stepLog.source;
    }

    // Jika DB kosong dan untuk demo date, coba ambil dari mock data
    if (foodLogsData.length === 0 && activitiesData.length === 0) {
      const { MOCK_FOOD_LOGS, MOCK_ACTIVITIES, MOCK_STEP_LOGS } = await import('@/lib/mockData');
      const mockFoods = MOCK_FOOD_LOGS.filter((f) => isSameWibDate(f.loggedAt, dateStr));
      const mockActs = MOCK_ACTIVITIES.filter((a) => isSameWibDate(a.startTime, dateStr));
      const mockStep = MOCK_STEP_LOGS.find((s) => s.dateStr === dateStr);

      if (mockFoods.length > 0 || mockActs.length > 0) {
        foodLogsData = mockFoods;
        activitiesData = mockActs;
      }
      if (mockStep && loggedDailySteps === null) {
        loggedDailySteps = mockStep.stepCount;
        stepSource = mockStep.source;
      }
    }
  } catch (err) {
    console.warn('Database fallback in getDailyNutritionAudit:', err);
    const { MOCK_FOOD_LOGS, MOCK_ACTIVITIES, MOCK_STEP_LOGS } = await import('@/lib/mockData');
    foodLogsData = MOCK_FOOD_LOGS.slice(0, 3);
    activitiesData = MOCK_ACTIVITIES.slice(0, 1);
    const mockStep = MOCK_STEP_LOGS.find((s) => s.dateStr === dateStr);
    if (mockStep) {
      loggedDailySteps = mockStep.stepCount;
      stepSource = mockStep.source;
    }
  }

  // 1. Agregasi Makronutrisi & Kalori Masuk
  const caloriesIn = Math.round(foodLogsData.reduce((acc, f) => acc + (f.calories || 0), 0));
  const totalProtein = Math.round(foodLogsData.reduce((acc, f) => acc + (f.proteinG || 0), 0));
  const totalCarbs = Math.round(foodLogsData.reduce((acc, f) => acc + (f.carbsG || 0), 0));
  const totalFat = Math.round(foodLogsData.reduce((acc, f) => acc + (f.fatG || 0), 0));

  // 2. Agregasi Kalori Keluar Menggunakan Model Anti-Double Counting (Strava vs Daily Steps NEAT)
  const isolatedEnergy = calculateIsolatedEnergyExpenditure({
    userWeightKg,
    activities: activitiesData,
    totalDailySteps: loggedDailySteps,
  });

  const {
    bmrCalories,
    activityCalories,
    totalDailySteps,
    workoutStepsAbsorbed,
    pureNeatSteps,
    neatCalories,
    caloriesOut,
    hasStravaWorkout,
    doubleCountingPrevented,
    deduplicatedCaloriesSaved,
    hasStepsLogged,
    stravaActivitiesSummary,
  } = isolatedEnergy;

  // 3. Net Calories & Status
  const netCalories = caloriesIn - caloriesOut;
  let status: EnergyBalanceStatus = 'Balanced';
  if (netCalories > 150) {
    status = 'Surplus';
  } else if (netCalories < -250) {
    status = 'Defisit';
  }

  // 4. Target Protein (1.6g / kg BB untuk endurance athlete)
  const targetProteinG = Math.round(userWeightKg * 1.6);
  const calorieProgressPercent = caloriesOut > 0 ? Math.min(Math.round((caloriesIn / caloriesOut) * 100), 200) : 0;
  const proteinProgressPercent = targetProteinG > 0 ? Math.min(Math.round((totalProtein / targetProteinG) * 100), 200) : 0;

  // 5. Analisis AI via Google Gemini (Sports Nutritionist dengan Pemahaman Anti-Double Counting)
  let evaluationMessage = '';
  let proteinStatus = '';
  let actionableTip = '';

  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyValid = apiKey && apiKey !== 'your_gemini_api_key' && apiKey !== 'mock_gemini_api_key';

  if (isKeyValid && forceAiRefresh && (caloriesIn > 0 || activityCalories > 0 || totalDailySteps > 0)) {
    const prompt = `Anda adalah Ahli Gizi Olahraga (Sports Nutritionist) bersertifikat internasional untuk pelari jalan raya dengan jadwal latihan mingguan terstruktur:
- Senin: Tempo / Speed Run (Jadwal Kunci)
- Kamis: Interval Training VO2Max (Jadwal Kunci)
- Sabtu: Progressive Long Run (Jadwal Kunci)
- Hari Lain: Active Recovery / Gym Cross-Training / Rest Day

Data Fisiologi & Energi Atlet untuk ${dateFormatted} (${dayName}):
- Fokus Jadwal Hari Ini: ${dayScheduleFocus} (Kategori: ${isTrainingDay ? 'Hari Latihan Kunci' : 'Pemulihan / Tambahan'})
- Berat Badan Atlet: ${userWeightKg} kg (Target protein minimal: ${targetProteinG}g @ 1.6g/kg BB)

KOMPONEN KALORI MASUK (Food Intake):
- Total Asupan Makanan: ${caloriesIn} kkal
  * Protein: ${totalProtein}g (${proteinProgressPercent}% dari target)
  * Karbohidrat: ${totalCarbs}g (Bahan bakar utama glikogen otot)
  * Lemak: ${totalFat}g
- Menu Makanan Hari Ini: ${foodLogsData.length > 0 ? foodLogsData.map((f) => f.foodName).join(', ') : 'Belum ada log makanan tercatat'}

KOMPONEN PENGELUARAN ENERGI (Energy Expenditure) & DE-DUPLIKASI STRAVA VS LANGKAH:
- Basal Metabolic Rate (BMR): ${bmrCalories} kkal
- Sesi Latihan Terstruktur (Strava/Manual): ${activityCalories} kkal
  * Detail Aktivitas: ${activitiesData.length > 0 ? activitiesData.map((a) => `${a.title} (${a.type}, ${a.calories || 0} kkal, estimasi ~${estimateWorkoutSteps(a)} langkah)`).join('; ') : 'Tidak ada sesi latihan'}
- Pelacakan Langkah Harian (Daily Steps): ${hasStepsLogged ? `${totalDailySteps.toLocaleString('id-ID')} langkah` : 'Belum ada input langkah harian'}
  * Estimasi Langkah Terserap Dalam Sesi Latihan: ${workoutStepsAbsorbed.toLocaleString('id-ID')} langkah (bagian ini sudah dihitung dalam kalori sesi latihan di atas)
  * Langkah NEAT Murni (Di Luar Jam Latihan): ${pureNeatSteps.toLocaleString('id-ID')} langkah (mobilitas harian, commuting, jalan santai)
  * Kalori NEAT Murni Terpisah: +${neatCalories} kkal
  * Status Proteksi Double Counting: ${doubleCountingPrevented ? `AKTIF: Berhasil menyaring duplikasi hitungan sebesar ${deduplicatedCaloriesSaved} kkal dari langkah yang bertumpuk dengan GPS/Heart-Rate Strava.` : 'Tidak terjadi penumpukan data ganda.'}
- TOTAL KALORI KELUAR RIIL (BMR + Latihan + NEAT Murni): ${caloriesOut} kkal
- NET KALORI: ${netCalories > 0 ? '+' : ''}${netCalories} kkal (Status: ${status})

PANDUAN REASONING AI (Sports Nutritionist):
1. Evaluasi Duplikasi Langkah vs Strava:
   - Periksa apakah lonjakan langkah harian murni karena aktivitas harian (commuting/pekerjaan/jalan santai) atau sebagian besar disumbang oleh sesi lari Strava (terutama jadwal kunci: Senin Tempo, Kamis Interval, Sabtu Long Run).
   - Apresiasi bahwa sistem telah mengisolasi kalori langkah NEAT murni (+${neatCalories} kkal) terpisah dari sesi latihan (${activityCalories} kkal), sehingga atlet mendapatkan angka defisit/surplus yang valid tanpa distorsi angka ganda (bukan ilusi defisit berlebihan).
2. Evaluasi Keseimbangan Energi & Pemulihan:
   - Jika 'Defisit' di hari latihan kunci, berikan peringatan risiko deplesi glikogen dan katabolisme otot.
   - Jika 'Surplus', nilai apakah surplus ini optimal untuk sintesis glikogen dan hipertrofi/perbaikan otot.
   - Evaluasi kecukupan protein (${totalProtein}g vs target ${targetProteinG}g) untuk perbaikan mikrorobekan otot pasca latihan.
3. Berikan saran praktis (actionableTip) yang spesifik dan langsung dapat dieksekusi pelari hari ini.

Kembalikan HANYA format strictly valid JSON tanpa markdown pembungkus lain:
{
  "status": "Surplus" | "Defisit" | "Balanced",
  "evaluationMessage": "2 kalimat tajam dan profesional yang mengevaluasi keseimbangan energi dan menegaskan pemisahan kalori Strava vs NEAT langkah harian",
  "proteinStatus": "1-2 kalimat spesifik mengenai kecukupan protein dan pemulihan serat otot",
  "actionableTip": "1 kalimat saran langsung untuk nutrisi/hidrasi atlet hari ini"
}`;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];
    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text?.trim() || '';
        if (rawText) {
          const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
          const parsed = JSON.parse(cleanedText);
          if (parsed.status && (parsed.status === 'Surplus' || parsed.status === 'Defisit' || parsed.status === 'Balanced')) {
            status = parsed.status;
          }
          evaluationMessage = parsed.evaluationMessage || '';
          proteinStatus = parsed.proteinStatus || '';
          actionableTip = parsed.actionableTip || '';
          break;
        }
      } catch (err) {
        console.warn(`Nutrition audit AI attempt failed on ${modelName}:`, err);
      }
    }
  }

  // Gunakan evaluasi heuristik jika Gemini tidak mengembalikan data
  if (!evaluationMessage) {
    const heuristic = generateHeuristicEvaluation({
      dayScheduleFocus,
      isTrainingDay,
      caloriesIn,
      caloriesOut,
      netCalories,
      status,
      totalProtein,
      targetProteinG,
      totalCarbs,
      totalDailySteps,
      workoutStepsAbsorbed,
      pureNeatSteps,
      neatCalories,
      doubleCountingPrevented,
      deduplicatedCaloriesSaved,
    });
    evaluationMessage = heuristic.evaluationMessage;
    proteinStatus = heuristic.proteinStatus;
    actionableTip = heuristic.actionableTip;
  }

  return {
    date: dateStr,
    dateFormatted,
    dayName,
    dayScheduleFocus,
    isTrainingDay,
    caloriesIn,
    caloriesOut,
    activityCalories,
    bmrCalories,
    netCalories,
    status,
    calorieProgressPercent,
    totalProtein,
    totalCarbs,
    totalFat,
    targetProteinG,
    proteinProgressPercent,
    evaluationMessage,
    proteinStatus,
    actionableTip,
    foodCount: foodLogsData.length,
    activityCount: activitiesData.length,
    // Step isolation & anti double-counting fields
    totalDailySteps,
    workoutStepsAbsorbed,
    pureNeatSteps,
    neatCalories,
    hasStravaWorkout,
    doubleCountingPrevented,
    deduplicatedCaloriesSaved,
    stepSource,
    hasStepsLogged,
    stravaActivitiesSummary,
  };
}

/**
 * Mengambil ringkasan audit nutrisi beberapa hari terakhir (untuk halaman /nutrition) secara cepat (Batch Query)
 */
export async function getNutritionAuditHistory({
  userId,
  days = 7,
}: {
  userId: string;
  days?: number;
}): Promise<DailyNutritionAuditData[]> {
  const result: DailyNutritionAuditData[] = [];
  const today = new Date();

  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);

  let allFoodLogs: Array<{ loggedAt: Date | string; calories: number; proteinG: number; carbsG: number; fatG: number; foodName: string }> = [];
  let allActivities: Array<{
    id?: string;
    startTime: Date | string;
    calories?: number | null;
    title: string;
    type: string;
    source?: string;
    stravaActivityId?: string | bigint | null;
    distanceMeters?: number | null;
    durationSec: number;
  }> = [];
  let allStepLogs: Array<{ dateStr: string; stepCount: number; source: string }> = [];
  let userWeightKg = 68;

  try {
    const [foodLogs, activities, latestWeight, stepLogs] = await Promise.all([
      prisma.foodLog.findMany({
        where: {
          userId,
          loggedAt: { gte: startDate, lte: endDate },
        },
        orderBy: { loggedAt: 'desc' },
      }),
      prisma.activity.findMany({
        where: {
          userId,
          startTime: { gte: startDate, lte: endDate },
        },
        orderBy: { startTime: 'desc' },
      }),
      prisma.weightLog.findFirst({
        where: { userId },
        orderBy: { loggedAt: 'desc' },
      }),
      prisma.stepLog.findMany({
        where: {
          userId,
        },
      }),
    ]);

    allFoodLogs = foodLogs;
    allActivities = activities;
    allStepLogs = stepLogs;
    if (latestWeight?.weightKg) {
      userWeightKg = latestWeight.weightKg;
    }

    if (allFoodLogs.length === 0 && allActivities.length === 0) {
      const { MOCK_FOOD_LOGS, MOCK_ACTIVITIES, MOCK_STEP_LOGS } = await import('@/lib/mockData');
      allFoodLogs = MOCK_FOOD_LOGS;
      allActivities = MOCK_ACTIVITIES;
      if (allStepLogs.length === 0) {
        allStepLogs = MOCK_STEP_LOGS;
      }
    }
  } catch (err) {
    console.warn('Database fallback in getNutritionAuditHistory:', err);
    const { MOCK_FOOD_LOGS, MOCK_ACTIVITIES, MOCK_STEP_LOGS } = await import('@/lib/mockData');
    allFoodLogs = MOCK_FOOD_LOGS;
    allActivities = MOCK_ACTIVITIES;
    allStepLogs = MOCK_STEP_LOGS;
  }

  // Pre-calculate target protein based on weight
  const targetProteinG = Math.round(userWeightKg * 1.6);

  // Group by date string YYYY-MM-DD
  for (let i = 0; i < days; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);
    const dateStr = getWibDateString(targetDate);
    const dateFormatted = formatWibDateIndonesian(targetDate);
    const { dayName, dayScheduleFocus, isTrainingDay } = getScheduleMeta(dateStr);

    // Filter food logs & activities for this date
    const dayFoods = allFoodLogs.filter((f) => isSameWibDate(f.loggedAt, dateStr));
    const dayActivities = allActivities.filter((a) => isSameWibDate(a.startTime, dateStr));

    const dayStepLog = allStepLogs.find((s) => s.dateStr === dateStr);
    const loggedSteps = dayStepLog ? dayStepLog.stepCount : null;

    const caloriesIn = Math.round(dayFoods.reduce((acc, f) => acc + (f.calories || 0), 0));
    const totalProtein = Math.round(dayFoods.reduce((acc, f) => acc + (f.proteinG || 0), 0));
    const totalCarbs = Math.round(dayFoods.reduce((acc, f) => acc + (f.carbsG || 0), 0));
    const totalFat = Math.round(dayFoods.reduce((acc, f) => acc + (f.fatG || 0), 0));

    const isolatedEnergy = calculateIsolatedEnergyExpenditure({
      userWeightKg,
      activities: dayActivities,
      totalDailySteps: loggedSteps,
    });

    const {
      bmrCalories,
      activityCalories,
      totalDailySteps,
      workoutStepsAbsorbed,
      pureNeatSteps,
      neatCalories,
      caloriesOut,
      hasStravaWorkout,
      doubleCountingPrevented,
      deduplicatedCaloriesSaved,
      hasStepsLogged,
      stravaActivitiesSummary,
    } = isolatedEnergy;

    const netCalories = caloriesIn - caloriesOut;

    let status: EnergyBalanceStatus = 'Balanced';
    if (netCalories > 150) {
      status = 'Surplus';
    } else if (netCalories < -250) {
      status = 'Defisit';
    }

    const calorieProgressPercent = caloriesOut > 0 ? Math.min(Math.round((caloriesIn / caloriesOut) * 100), 200) : 0;
    const proteinProgressPercent = targetProteinG > 0 ? Math.min(Math.round((totalProtein / targetProteinG) * 100), 200) : 0;

    const heuristic = generateHeuristicEvaluation({
      dayScheduleFocus,
      isTrainingDay,
      caloriesIn,
      caloriesOut,
      netCalories,
      status,
      totalProtein,
      targetProteinG,
      totalCarbs,
      totalDailySteps,
      workoutStepsAbsorbed,
      pureNeatSteps,
      neatCalories,
      doubleCountingPrevented,
      deduplicatedCaloriesSaved,
    });

    result.push({
      date: dateStr,
      dateFormatted,
      dayName,
      dayScheduleFocus,
      isTrainingDay,
      caloriesIn,
      caloriesOut,
      activityCalories,
      bmrCalories,
      netCalories,
      status,
      calorieProgressPercent,
      totalProtein,
      totalCarbs,
      totalFat,
      targetProteinG,
      proteinProgressPercent,
      evaluationMessage: heuristic.evaluationMessage,
      proteinStatus: heuristic.proteinStatus,
      actionableTip: heuristic.actionableTip,
      foodCount: dayFoods.length,
      activityCount: dayActivities.length,
      totalDailySteps,
      workoutStepsAbsorbed,
      pureNeatSteps,
      neatCalories,
      hasStravaWorkout,
      doubleCountingPrevented,
      deduplicatedCaloriesSaved,
      stepSource: dayStepLog?.source,
      hasStepsLogged,
      stravaActivitiesSummary,
    });
  }

  return result;
}
