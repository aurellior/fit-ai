import { StravaActivityStepSummary } from '@/types';

/**
 * Mengestimasi jumlah langkah kaki atlet yang dihasilkan oleh suatu aktivitas olahraga terstruktur
 * berdasarkan standar biomekanika fisiologi olahraga (ACSM & sports science).
 * 
 * - Lari (RUN): ~1.250 langkah per kilometer (cadence rata-rata ~165-175 spm).
 * - Jalan (WALK/HIKE): ~1.350 langkah per kilometer (cadence ~105-115 spm).
 * - Angkat Beban (WEIGHT_TRAINING): ~35 langkah per menit (gerakan transisi antar set & pemulihan aktif).
 * - Gowes (RIDE) & Berenang (SWIM): 0 langkah (non-impact / peredam pedometer).
 */
export function estimateWorkoutSteps(activity: {
  type: string;
  distanceMeters?: number | null;
  durationSec: number;
}): number {
  const { type, distanceMeters, durationSec } = activity;
  const upperType = type.toUpperCase();

  if (upperType === 'RUN') {
    if (distanceMeters && distanceMeters > 0) {
      return Math.round((distanceMeters / 1000) * 1250);
    }
    if (durationSec && durationSec > 0) {
      return Math.round((durationSec / 60) * 165);
    }
    return 0;
  }

  if (upperType === 'WALK' || upperType === 'HIKE') {
    if (distanceMeters && distanceMeters > 0) {
      return Math.round((distanceMeters / 1000) * 1350);
    }
    if (durationSec && durationSec > 0) {
      return Math.round((durationSec / 60) * 110);
    }
    return 0;
  }

  if (upperType === 'WEIGHT_TRAINING') {
    if (durationSec && durationSec > 0) {
      return Math.round((durationSec / 60) * 35);
    }
    return 0;
  }

  return 0;
}

export interface StepIsolationInput {
  userWeightKg: number;
  activities: Array<{
    id?: string;
    title: string;
    type: string;
    source?: string;
    stravaActivityId?: string | bigint | null;
    calories?: number | null;
    distanceMeters?: number | null;
    durationSec: number;
  }>;
  totalDailySteps?: number | null;
}

export interface StepIsolationResult {
  bmrCalories: number;
  activityCalories: number;
  totalDailySteps: number;
  workoutStepsAbsorbed: number;
  pureNeatSteps: number;
  neatCalories: number;
  caloriesOut: number;
  hasStravaWorkout: boolean;
  doubleCountingPrevented: boolean;
  deduplicatedCaloriesSaved: number;
  hasStepsLogged: boolean;
  stravaActivitiesSummary: StravaActivityStepSummary[];
}

/**
 * Mengalkulasi pengeluaran energi harian secara matematis dengan mengisolasi
 * porsi langkah olahraga (terutama dari Strava) terhadap langkah harian total (daily steps).
 * 
 * Hal ini mencegah double counting di mana kalori lari sudah dihitung dari GPS/HR Strava
 * lalu dihitung kembali dari pedometer langkah harian.
 */
export function calculateIsolatedEnergyExpenditure({
  userWeightKg = 68,
  activities = [],
  totalDailySteps = null,
}: StepIsolationInput): StepIsolationResult {
  // 1. Basal Metabolic Rate praktis atlet (24 kkal/kg/hari)
  const bmrCalories = Math.round(userWeightKg * 24);

  // 2. Kalori Latihan Terstruktur (dari Strava atau Manual)
  const activityCalories = Math.round(
    activities.reduce((acc, a) => acc + (a.calories || 0), 0)
  );

  // 3. Ringkasan Aktivitas & Estimasi Langkah yang Terserap
  let totalWorkoutSteps = 0;
  let hasStravaWorkout = false;

  const stravaActivitiesSummary: StravaActivityStepSummary[] = activities.map((act, idx) => {
    const isStrava = act.source === 'STRAVA' || Boolean(act.stravaActivityId);
    if (isStrava) hasStravaWorkout = true;

    const steps = estimateWorkoutSteps(act);
    totalWorkoutSteps += steps;

    return {
      id: act.id || `act-${idx}`,
      title: act.title,
      type: act.type,
      calories: Math.round(act.calories || 0),
      distanceKm: act.distanceMeters ? Number((act.distanceMeters / 1000).toFixed(2)) : undefined,
      durationSec: act.durationSec,
      stepsAbsorbed: steps,
      isStrava,
    };
  });

  const stepsProvided = typeof totalDailySteps === 'number' && !isNaN(totalDailySteps) && totalDailySteps > 0;
  const inputSteps = stepsProvided ? Math.round(totalDailySteps) : 0;

  let workoutStepsAbsorbed = 0;
  let pureNeatSteps = 0;
  let neatCalories = 0;
  let deduplicatedCaloriesSaved = 0;
  let doubleCountingPrevented = false;

  // Faktor kalori berjalan biasa (NEAT / Non-Exercise Activity Thermogenesis)
  // Berdasarkan pengeluaran metabolik ambulatori: ~0.00057 kkal per kg berat per langkah.
  const neatKcalPerStep = userWeightKg * 0.00057;

  if (stepsProvided) {
    // Skenario A: Pengguna memasukkan data langkah harian
    // Langkah latihan yang terserap tidak boleh melebihi input langkah harian yang dilaporkan
    workoutStepsAbsorbed = Math.min(inputSteps, totalWorkoutSteps);

    // Langkah NEAT murni adalah selisih antara total langkah dan langkah latihan
    pureNeatSteps = Math.max(0, inputSteps - totalWorkoutSteps);

    // Kalori NEAT murni hanya dihitung dari langkah di luar jam olahraga
    neatCalories = Math.round(pureNeatSteps * neatKcalPerStep);

    // Kalori potensial yang berhasil diselamatkan dari double counting
    deduplicatedCaloriesSaved = Math.round(workoutStepsAbsorbed * neatKcalPerStep);

    // Double counting dicegah jika ada langkah olahraga yang terserap dan kalori latihan tercatat
    doubleCountingPrevented = workoutStepsAbsorbed > 0 && activityCalories > 0;
  } else {
    // Skenario B: Belum ada input langkah harian
    workoutStepsAbsorbed = totalWorkoutSteps;
    pureNeatSteps = 0;
    neatCalories = 0;
    deduplicatedCaloriesSaved = 0;
    doubleCountingPrevented = false;
  }

  // 4. Total Kalori Keluar Riil
  // Formula: BMR + Kalori Latihan Terstruktur + Kalori NEAT Murni (Luar Jam Olahraga)
  const caloriesOut = bmrCalories + activityCalories + neatCalories;

  return {
    bmrCalories,
    activityCalories,
    totalDailySteps: inputSteps,
    workoutStepsAbsorbed,
    pureNeatSteps,
    neatCalories,
    caloriesOut,
    hasStravaWorkout,
    doubleCountingPrevented,
    deduplicatedCaloriesSaved,
    hasStepsLogged: stepsProvided,
    stravaActivitiesSummary,
  };
}
