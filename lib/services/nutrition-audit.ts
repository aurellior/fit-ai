import { ai } from '@/lib/services/gemini';
import { prisma } from '@/lib/db/prisma';
import { DailyNutritionAuditData, EnergyBalanceStatus } from '@/types';

const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface ScheduleMeta {
  dayName: string;
  dayScheduleFocus: string;
  isTrainingDay: boolean;
}

function getScheduleMeta(date: Date): ScheduleMeta {
  const dayIndex = date.getDay();
  const dayName = INDONESIAN_DAYS[dayIndex];

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

function formatDateIndonesian(date: Date): string {
  const dayName = INDONESIAN_DAYS[date.getDay()];
  const day = date.getDate();
  const month = INDONESIAN_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
}

function toIsoDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Evaluator heuristik deterministik jika Gemini API offline, limit tercapai, atau menggunakan mock key
 */
function generateHeuristicEvaluation({
  dayScheduleFocus,
  isTrainingDay,
  caloriesIn,
  caloriesOut,
  netCalories,
  status,
  totalProtein,
  targetProteinG,
  totalCarbs,
}: {
  dayScheduleFocus: string;
  isTrainingDay: boolean;
  caloriesIn: number;
  caloriesOut: number;
  netCalories: number;
  status: EnergyBalanceStatus;
  totalProtein: number;
  targetProteinG: number;
  totalCarbs: number;
}): { evaluationMessage: string; proteinStatus: string; actionableTip: string } {
  const proteinGap = targetProteinG - totalProtein;

  let evaluationMessage = '';
  if (caloriesIn === 0) {
    evaluationMessage = `Belum ada log makanan tercatat untuk hari ini. Pastikan Anda mengunggah menu makanan untuk memantau asupan energi terhadap jadwal ${dayScheduleFocus}.`;
  } else if (isTrainingDay) {
    if (status === 'Defisit') {
      evaluationMessage = `Energi harian berada dalam defisit ${Math.abs(netCalories)} kkal di hari latihan kunci (${dayScheduleFocus}). Waspadai deplesi glikogen jika defisit melebihi 400 kkal sebelum sesi lari berikutnya.`;
    } else if (status === 'Surplus') {
      evaluationMessage = `Asupan energi berada dalam surplus terkendali (+${netCalories} kkal), sangat baik untuk memaksimalkan resintesis glikogen otot pasca ${dayScheduleFocus}.`;
    } else {
      evaluationMessage = `Energy balance sangat seimbang untuk mendukung intensitas ${dayScheduleFocus}. Pasokan energi pas untuk performa dan tidak membebani cadangan lemak tubuh.`;
    }
  } else {
    if (status === 'Surplus' && netCalories > 300) {
      evaluationMessage = `Asupan kalori berada dalam surplus (+${netCalories} kkal) pada hari pemulihan/istirahat. Idealnya pertahankan net kalori mendekati balanced agar komposisi tubuh tetap ramping.`;
    } else if (status === 'Defisit') {
      evaluationMessage = `Defisit ringan (${Math.abs(netCalories)} kkal) pada hari istirahat aman untuk menjaga lean body mass selama asupan mikronutrisi tetap optimal.`;
    } else {
      evaluationMessage = `Energy balance harian sangat terukur pada hari pemulihan. Metabolisme basal terpenuhi dengan baik tanpa penumpukan kalori berlebih.`;
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
  if (isTrainingDay && totalCarbs < 150 && caloriesIn > 0) {
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
  const dateObj = targetDate ? new Date(targetDate) : new Date();
  const dateStr = toIsoDateString(dateObj);
  const dateFormatted = formatDateIndonesian(dateObj);
  const { dayName, dayScheduleFocus, isTrainingDay } = getScheduleMeta(dateObj);

  // Batas awal & akhir hari (00:00:00 - 23:59:59 lokal)
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);

  let foodLogsData: Array<{ calories: number; proteinG: number; carbsG: number; fatG: number; foodName: string }> = [];
  let activitiesData: Array<{ calories?: number | null; title: string; type: string; durationSec: number }> = [];
  let userWeightKg = 68;

  try {
    const [foodLogs, activities, latestWeight] = await Promise.all([
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
    ]);

    foodLogsData = foodLogs;
    activitiesData = activities;
    if (latestWeight?.weightKg) {
      userWeightKg = latestWeight.weightKg;
    }

    // Jika DB kosong dan untuk demo date, coba ambil dari mock data
    if (foodLogsData.length === 0 && activitiesData.length === 0) {
      const { MOCK_FOOD_LOGS, MOCK_ACTIVITIES } = await import('@/lib/mockData');
      const mockFoods = MOCK_FOOD_LOGS.filter((f) => {
        const d = new Date(f.loggedAt);
        return d.getDate() === dateObj.getDate() && d.getMonth() === dateObj.getMonth();
      });
      const mockActs = MOCK_ACTIVITIES.filter((a) => {
        const d = new Date(a.startTime);
        return d.getDate() === dateObj.getDate() && d.getMonth() === dateObj.getMonth();
      });

      if (mockFoods.length > 0 || mockActs.length > 0) {
        foodLogsData = mockFoods;
        activitiesData = mockActs;
      }
    }
  } catch (err) {
    console.warn('Database fallback in getDailyNutritionAudit:', err);
    const { MOCK_FOOD_LOGS, MOCK_ACTIVITIES } = await import('@/lib/mockData');
    foodLogsData = MOCK_FOOD_LOGS.slice(0, 3);
    activitiesData = MOCK_ACTIVITIES.slice(0, 1);
  }

  // 1. Agregasi Makronutrisi & Kalori Masuk
  const caloriesIn = Math.round(foodLogsData.reduce((acc, f) => acc + (f.calories || 0), 0));
  const totalProtein = Math.round(foodLogsData.reduce((acc, f) => acc + (f.proteinG || 0), 0));
  const totalCarbs = Math.round(foodLogsData.reduce((acc, f) => acc + (f.carbsG || 0), 0));
  const totalFat = Math.round(foodLogsData.reduce((acc, f) => acc + (f.fatG || 0), 0));

  // 2. Agregasi Kalori Keluar (Aktivitas + BMR)
  const activityCalories = Math.round(
    activitiesData.reduce((acc, a) => acc + (a.calories || 0), 0)
  );
  // BMR praktis atlet: ~24 kkal per kg berat badan per hari
  const bmrCalories = Math.round(userWeightKg * 24);
  const caloriesOut = activityCalories + bmrCalories;

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

  // 5. Analisis AI via Google Gemini (sports nutritionist)
  let evaluationMessage = '';
  let proteinStatus = '';
  let actionableTip = '';

  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyValid = apiKey && apiKey !== 'your_gemini_api_key' && apiKey !== 'mock_gemini_api_key';

  if (isKeyValid && (forceAiRefresh || caloriesIn > 0 || activityCalories > 0)) {
    const prompt = `Anda adalah Ahli Gizi Olahraga (Sports Nutritionist) bersertifikat internasional untuk pelari jalan raya dengan jadwal latihan mingguan terstruktur:
- Senin: Tempo / Speed Run
- Kamis: Interval Training (VO2Max)
- Sabtu: Progressive Long Run
- Hari Lain: Active Recovery / Gym Cross-Training / Rest Day

Data Harian Atlet untuk ${dateFormatted} (${dayName}):
- Jadwal Lari Hari Ini: ${dayScheduleFocus} (Kategori Hari Latihan: ${isTrainingDay ? 'Hari Latihan Kunci' : 'Pemulihan / Tambahan'})
- Berat Badan: ${userWeightKg} kg (Target protein minimal: ${targetProteinG}g)
- Total Kalori Masuk (Food Intake): ${caloriesIn} kkal
  * Protein: ${totalProtein}g
  * Karbohidrat: ${totalCarbs}g
  * Lemak: ${totalFat}g
- Total Kalori Keluar: ${caloriesOut} kkal
  * Dari Aktivitas Latihan: ${activityCalories} kkal
  * Basal Metabolic Rate (BMR): ${bmrCalories} kkal
- Net Kalori: ${netCalories > 0 ? '+' : ''}${netCalories} kkal (Status Kalkulasi: ${status})
- Aktivitas Latihan Hari Ini: ${activitiesData.length > 0 ? activitiesData.map((a) => `${a.title} (${a.calories || 0} kkal)`).join(', ') : 'Tidak ada sesi olahraga tercatat'}
- Makanan Hari Ini: ${foodLogsData.length > 0 ? foodLogsData.map((f) => f.foodName).join(', ') : 'Belum ada log makanan'}

Instruksi Analisis:
1. Tentukan status apakah "Surplus", "Defisit", atau "Balanced".
2. Buat evaluationMessage: 2 kalimat tegas, suportif, dan berbasis fisiologi olahraga tentang apakah asupan cukup, kurang, atau berlebih untuk mendukung jadwal hari ini (${dayScheduleFocus}).
3. Buat proteinStatus: 1-2 kalimat khusus tentang kecukupan protein (${totalProtein}g vs target ${targetProteinG}g) untuk pemulihan otot pelari.
4. Buat actionableTip: 1 kalimat saran praktis langsung yang bisa dieksekusi pelari hari ini.

Kembalikan HANYA strictly valid JSON:
{
  "status": "Surplus" | "Defisit" | "Balanced",
  "evaluationMessage": "string",
  "proteinStatus": "string",
  "actionableTip": "string"
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
  };
}

/**
 * Mengambil ringkasan audit nutrisi beberapa hari terakhir (untuk halaman /nutrition)
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

  // Ambil data untuk n hari ke belakang
  for (let i = 0; i < days; i++) {
    const target = new Date(today);
    target.setDate(today.getDate() - i);
    // Untuk historical overview, jangan panggil Gemini setiap hari jika offline (gunakan evaluasi cepat)
    const audit = await getDailyNutritionAudit({
      userId,
      targetDate: target,
      forceAiRefresh: i === 0, // Hanya refresh AI untuk hari ini
    });
    result.push(audit);
  }

  return result;
}
