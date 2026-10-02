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

import {
  getWibDayIndex,
  getWibParts,
  getWibDateString,
  getWibDayName,
  isSameWibDate,
} from '@/lib/timezone';
import { DEFAULT_WEEKLY_SCHEDULES } from '@/lib/constants/workout';

interface ScheduleAuditResult {
  smartSkipAudit: SmartSkipAudit;
  nextWorkoutDay: CoachPlanData['nextWorkoutDay'];
  schedule: {
    monday: CoachWorkoutDay;
    thursday: CoachWorkoutDay;
    saturday: CoachWorkoutDay;
  };
  todayDynamicDirective?: CoachPlanData['todayDynamicDirective'];
}

/**
 * Memeriksa apakah suatu aktivitas melibatkan latihan beban kaki (Leg Day)
 */
function checkIsLegDay(act: ActivityData): boolean {
  if (act.type !== 'WEIGHT_TRAINING') return false;
  const text = `${act.title || ''} ${act.notes || ''}`.toLowerCase();
  const legKeywords = ['leg', 'kaki', 'tungkai', 'squat', 'lunge', 'deadlift', 'quad', 'calf', 'paha'];
  const hasKeyword = legKeywords.some((kw) => text.includes(kw));
  const hasGymSet =
    Array.isArray(act.gymSets) &&
    act.gymSets.some((s) => {
      const ex = ((s as { exercise?: string }).exercise || '').toLowerCase();
      return legKeywords.some((kw) => ex.includes(kw));
    });
  return hasKeyword || hasGymSet;
}

/**
 * Format ringkasan aktivitas selesai untuk disematkan ke kartu jadwal
 */
function formatCompletedActivity(act: ActivityData, executedOnDay?: string) {
  return {
    title: act.title,
    distanceKm: Number(((act.distanceMeters || 0) / 1000).toFixed(2)),
    paceFormatted: act.avgPaceSecPerKm
      ? `${Math.floor(act.avgPaceSecPerKm / 60)}'${Math.round(act.avgPaceSecPerKm % 60)
          .toString()
          .padStart(2, '0')}"/km`
      : 'Pace Sesuai Target',
    executedOnDay,
  };
}

/**
 * Engine Inti: Audit Jadwal Adaptif Penuh (Anchor Days: Senin, Kamis, Sabtu)
 * Mendukung fleksibilitas penuh jika atlet lari di hari lain atau melakukan cross-training (gym/sepeda).
 */
export function auditScheduleAndAdaptivePlan(
  activities: ActivityData[],
  existingPlan?: CoachPlanData | null
): ScheduleAuditResult {
  const now = new Date();
  const currentDayOfWeek = getWibDayIndex(now); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  const todayWibName = getWibDayName(now);

  // Hitung tanggal Senin di minggu berjalan dalam kalender WIB
  const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const { year, month, day } = getWibParts(now);

  // Bangun data 7 hari dalam minggu berjalan (WIB)
  const weekDays = [
    { dayIndex: 1, name: 'Senin', offset: distanceToMonday },
    { dayIndex: 2, name: 'Selasa', offset: distanceToMonday + 1 },
    { dayIndex: 3, name: 'Rabu', offset: distanceToMonday + 2 },
    { dayIndex: 4, name: 'Kamis', offset: distanceToMonday + 3 },
    { dayIndex: 5, name: 'Jumat', offset: distanceToMonday + 4 },
    { dayIndex: 6, name: 'Sabtu', offset: distanceToMonday + 5 },
    { dayIndex: 0, name: 'Minggu', offset: distanceToMonday + 6 },
  ].map((d) => {
    const dateObj = new Date(Date.UTC(year, month - 1, day + d.offset, 12, 0, 0));
    const dateStr = getWibDateString(dateObj);
    const dateLabel = dateObj.toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
    });
    return { ...d, dateObj, dateStr, dateLabel };
  });

  const mondayInfo = weekDays[0];
  const tuesdayInfo = weekDays[1];
  const wednesdayInfo = weekDays[2];
  const thursdayInfo = weekDays[3];
  const fridayInfo = weekDays[4];
  const saturdayInfo = weekDays[5];
  const sundayInfo = weekDays[6];

  const runActivities = activities.filter((a) => a.type === 'RUN');

  // Aktivitas lari per hari dalam minggu ini
  const mondayRuns = runActivities.filter((a) => isSameWibDate(a.startTime, mondayInfo.dateStr));
  const tuesdayRuns = runActivities.filter((a) => isSameWibDate(a.startTime, tuesdayInfo.dateStr));
  const wednesdayRuns = runActivities.filter((a) => isSameWibDate(a.startTime, wednesdayInfo.dateStr));
  const thursdayRuns = runActivities.filter((a) => isSameWibDate(a.startTime, thursdayInfo.dateStr));
  const fridayRuns = runActivities.filter((a) => isSameWibDate(a.startTime, fridayInfo.dateStr));
  const saturdayRuns = runActivities.filter((a) => isSameWibDate(a.startTime, saturdayInfo.dateStr));
  const sundayRuns = runActivities.filter((a) => isSameWibDate(a.startTime, sundayInfo.dateStr));

  const mondayRun = mondayRuns[0];
  const tuesdayRun = tuesdayRuns[0];
  const wednesdayRun = wednesdayRuns[0];
  const thursdayRun = thursdayRuns[0];
  const fridayRun = fridayRuns[0];
  const saturdayRun = saturdayRuns[0];
  const sundayRun = sundayRuns[0];

  // Aktivitas hari ini dan kemarin
  const todayDateStr = getWibDateString(now);
  const yesterdayDateObj = new Date(Date.UTC(year, month - 1, day - 1, 12, 0, 0));
  const yesterdayDateStr = getWibDateString(yesterdayDateObj);

  const todayActs = activities.filter((a) => isSameWibDate(a.startTime, todayDateStr));
  const yesterdayActs = activities.filter((a) => isSameWibDate(a.startTime, yesterdayDateStr));

  const todayRun = todayActs.find((a) => a.type === 'RUN');
  const yesterdayRun = yesterdayActs.find((a) => a.type === 'RUN');
  const yesterdayLegDay = yesterdayActs.find((a) => checkIsLegDay(a));

  // Cek aktivitas non-lari dalam 48 jam terakhir untuk evaluasi fatik neuromuskular
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 3600 * 1000);
  const recentActivities = activities.filter((a) => new Date(a.startTime) >= fortyEightHoursAgo);

  const recentLegDay = recentActivities.find((a) => checkIsLegDay(a));
  const recentHeavyRide = recentActivities.find(
    (a) => a.type === 'RIDE' && ((a.distanceMeters && a.distanceMeters >= 15000) || (a.durationSec && a.durationSec >= 2400))
  );

  let crossTrainingNotice: string | null = null;
  if (recentLegDay) {
    const legDayName = getWibDayName(recentLegDay.startTime);
    crossTrainingNotice = `Terdeteksi sesi Latihan Beban Kaki / Leg Day (${legDayName}): Proteksi sendi diaktifkan, intensitas lari dialihkan ke ritme aerobik nyaman agar otot paha dan tendon aman.`;
  } else if (recentHeavyRide) {
    const rideDayName = getWibDayName(recentHeavyRide.startTime);
    crossTrainingNotice = `Terdeteksi sesi Bersepeda intensif (${rideDayName}): Stimulasi kardio aerobik telah terserap, target lari diselaraskan secara seimbang.`;
  }

  // Cek apakah ada sesi yang telah di-reschedule secara manual oleh user pada minggu ini
  const isMondayRescheduled =
    existingPlan?.schedule?.monday?.status === 'rescheduled' && !mondayRun && !tuesdayRun;
  const isThursdayRescheduled =
    existingPlan?.schedule?.thursday?.status === 'rescheduled' && !thursdayRun && !wednesdayRun && !fridayRun;
  const isSaturdayRescheduled =
    existingPlan?.schedule?.saturday?.status === 'rescheduled' && !saturdayRun && !sundayRun;

  const adaptiveShifts: NonNullable<SmartSkipAudit['adaptiveShifts']> = [];

  // ==========================================
  // AUDIT SLOT 1: SENIN (Anchor: Speed/Tempo)
  // ==========================================
  let mondayStatus: ScheduledDayStatus = 'upcoming';
  let mondayFulfilledOn: string | undefined = undefined;
  let mondayCompletedAct = null;
  let mondayIsAdjusted = false;
  let mondayAdjustmentReason: string | null = null;

  if (mondayRun) {
    mondayStatus = 'completed';
    mondayFulfilledOn = 'Senin';
    mondayCompletedAct = formatCompletedActivity(mondayRun, 'Senin');
  } else if (tuesdayRun) {
    // Atlet lari di hari Selasa: Mengakuisisi sesi awal minggu secara adaptif!
    mondayStatus = 'completed';
    mondayFulfilledOn = 'Selasa';
    mondayCompletedAct = formatCompletedActivity(tuesdayRun, 'Selasa');
    mondayIsAdjusted = true;
    mondayAdjustmentReason = `Diselesaikan fleksibel di hari Selasa (${tuesdayRun.title}, ${(
      (tuesdayRun.distanceMeters || 0) / 1000
    ).toFixed(1)} km) menggantikan sesi Senin.`;
    adaptiveShifts.push({
      targetSlot: 'Senin (Tempo)',
      actualDay: 'Selasa',
      activityTitle: tuesdayRun.title,
      note: 'Sesi tempo awal minggu dieksekusi fleksibel di hari Selasa.',
    });
  } else if (isMondayRescheduled) {
    mondayStatus = 'rescheduled';
  } else if (currentDayOfWeek === 1) {
    mondayStatus = 'today';
  } else if (currentDayOfWeek === 2) {
    // Hari Selasa masih dalam jendela adaptif untuk mengeksekusi sesi awal minggu
    mondayStatus = 'today';
    mondayIsAdjusted = true;
    mondayAdjustmentReason = 'Jendela Adaptif: Sesi awal minggu dapat dieksekusi hari Selasa ini.';
  } else {
    // Hari Rabu ke atas dan tidak ada lari di Senin/Selasa
    mondayStatus = 'skipped';
  }

  // ==========================================
  // AUDIT SLOT 2: KAMIS (Anchor: Interval VO2Max)
  // ==========================================
  let thursdayStatus: ScheduledDayStatus = 'upcoming';
  let thursdayFulfilledOn: string | undefined = undefined;
  let thursdayCompletedAct = null;
  let thursdayIsAdjusted = false;
  let thursdayAdjustmentReason: string | null = null;

  if (thursdayRun) {
    thursdayStatus = 'completed';
    thursdayFulfilledOn = 'Kamis';
    thursdayCompletedAct = formatCompletedActivity(thursdayRun, 'Kamis');
  } else if (wednesdayRun && (!tuesdayRun || mondayRun)) {
    // Atlet lari di hari Rabu (dan bukan satu-satunya lari untuk menggantikan Senin)
    thursdayStatus = 'completed';
    thursdayFulfilledOn = 'Rabu';
    thursdayCompletedAct = formatCompletedActivity(wednesdayRun, 'Rabu');
    thursdayIsAdjusted = true;
    thursdayAdjustmentReason = `Sesi tengah minggu dimajukan ke hari Rabu (${wednesdayRun.title}). Hari Kamis dialihkan untuk pemulihan/gym.`;
    adaptiveShifts.push({
      targetSlot: 'Kamis (Interval)',
      actualDay: 'Rabu',
      activityTitle: wednesdayRun.title,
      note: 'Sesi tengah minggu dimajukan fleksibel ke hari Rabu.',
    });
  } else if (fridayRun) {
    // Atlet lari di hari Jumat: Menggeser sesi interval tengah minggu
    thursdayStatus = 'completed';
    thursdayFulfilledOn = 'Jumat';
    thursdayCompletedAct = formatCompletedActivity(fridayRun, 'Jumat');
    thursdayIsAdjusted = true;
    thursdayAdjustmentReason = `Sesi tengah minggu digeser ke hari Jumat (${fridayRun.title}). Sesi Long Run akhir pekan disesuaikan.`;
    adaptiveShifts.push({
      targetSlot: 'Kamis (Interval)',
      actualDay: 'Jumat',
      activityTitle: fridayRun.title,
      note: 'Sesi tengah minggu dieksekusi di hari Jumat.',
    });
  } else if (isThursdayRescheduled) {
    thursdayStatus = 'rescheduled';
  } else if (currentDayOfWeek === 4) {
    thursdayStatus = 'today';
  } else if (currentDayOfWeek === 5) {
    // Hari Jumat masih jendela adaptif untuk interval tengah minggu sebelum akhir pekan
    thursdayStatus = 'today';
    thursdayIsAdjusted = true;
    thursdayAdjustmentReason = 'Jendela Adaptif: Eksekusi sesi interval tengah minggu di hari Jumat ini.';
  } else if (currentDayOfWeek >= 1 && currentDayOfWeek < 4) {
    thursdayStatus = 'upcoming';
  } else {
    // Hari Sabtu / Minggu dan tidak ada lari di Rabu/Kamis/Jumat
    thursdayStatus = 'skipped';
  }

  // ==========================================
  // AUDIT SLOT 3: SABTU (Anchor: Progressive Long Run)
  // ==========================================
  let saturdayStatus: ScheduledDayStatus = 'upcoming';
  let saturdayFulfilledOn: string | undefined = undefined;
  let saturdayCompletedAct = null;
  let saturdayIsAdjusted = false;
  let saturdayAdjustmentReason: string | null = null;

  if (saturdayRun) {
    saturdayStatus = 'completed';
    saturdayFulfilledOn = 'Sabtu';
    saturdayCompletedAct = formatCompletedActivity(saturdayRun, 'Sabtu');
  } else if (sundayRun) {
    // Atlet lari di hari Minggu: Menuntaskan Long Run akhir pekan
    saturdayStatus = 'completed';
    saturdayFulfilledOn = 'Minggu';
    saturdayCompletedAct = formatCompletedActivity(sundayRun, 'Minggu');
    saturdayIsAdjusted = true;
    saturdayAdjustmentReason = `Long Run akhir pekan diselesaikan di hari Minggu (${sundayRun.title}, ${(
      (sundayRun.distanceMeters || 0) / 1000
    ).toFixed(1)} km).`;
    adaptiveShifts.push({
      targetSlot: 'Sabtu (Long Run)',
      actualDay: 'Minggu',
      activityTitle: sundayRun.title,
      note: 'Long Run akhir pekan diselesaikan fleksibel di hari Minggu.',
    });
  } else if (isSaturdayRescheduled) {
    saturdayStatus = 'rescheduled';
  } else if (currentDayOfWeek === 6) {
    saturdayStatus = 'today';
  } else if (currentDayOfWeek === 0) {
    // Hari Minggu adalah jendela adaptif Long Run jika Sabtu belum lari
    saturdayStatus = 'today';
    saturdayIsAdjusted = true;
    saturdayAdjustmentReason = 'Jendela Adaptif: Long Run akhir pekan dieksekusi di hari Minggu ini.';
  } else {
    saturdayStatus = 'upcoming';
  }

  const skippedDayNames: string[] = [];
  if ((mondayStatus as string) === 'skipped') skippedDayNames.push('Senin');
  if ((thursdayStatus as string) === 'skipped') skippedDayNames.push('Kamis');
  if ((saturdayStatus as string) === 'skipped') skippedDayNames.push('Sabtu');

  const hasSkippedDays =
    skippedDayNames.length > 0 || isMondayRescheduled || isThursdayRescheduled || isSaturdayRescheduled;

  // Bangun Workout Days dasar (dengan preservasi data reschedule jika ada)
  const mondayWorkout: CoachWorkoutDay = {
    dayName: 'Senin',
    focus: isMondayRescheduled ? existingPlan!.schedule.monday.focus : 'Tempo / Speed Run',
    originalFocus: 'Tempo / Speed Run',
    targetMetric: isMondayRescheduled
      ? existingPlan!.schedule.monday.targetMetric
      : '4.5 km - 5.0 km • Pace 7:15 - 7:30/km',
    details: isMondayRescheduled
      ? existingPlan!.schedule.monday.details
      : '1 km pemanasan santai (Pace 8:30), 2.5 km Tempo Run terkunci di Pace 7:15-7:30/km, ditutup 1 km pendinginan jalan aktif.',
    intensityBadge: 'High',
    status: mondayStatus,
    isAdjusted: mondayIsAdjusted || (isMondayRescheduled ? true : false),
    adjustmentReason: mondayAdjustmentReason || (isMondayRescheduled ? existingPlan!.schedule.monday.adjustmentReason : null),
    completedActivity: mondayCompletedAct,
  };

  const thursdayWorkout: CoachWorkoutDay = {
    dayName: 'Kamis',
    focus: isThursdayRescheduled ? existingPlan!.schedule.thursday.focus : 'Interval / Mid-Week Endurance',
    originalFocus: 'Interval / Mid-Week Endurance',
    targetMetric: isThursdayRescheduled
      ? existingPlan!.schedule.thursday.targetMetric
      : '5x 400m @ Pace 6:45 - 7:00/km (Rest 90s)',
    details: isThursdayRescheduled
      ? existingPlan!.schedule.thursday.details
      : '1 km jogging ringan dinamis. 5 set lari 400m cepat dengan istirahat jalan 90 detik tiap set. Jangan duduk saat jeda rest.',
    intensityBadge: 'High',
    status: thursdayStatus,
    isAdjusted: thursdayIsAdjusted || (isThursdayRescheduled ? true : false),
    adjustmentReason: thursdayAdjustmentReason || (isThursdayRescheduled ? existingPlan!.schedule.thursday.adjustmentReason : null),
    completedActivity: thursdayCompletedAct,
  };

  const saturdayWorkout: CoachWorkoutDay = {
    dayName: 'Sabtu',
    focus: isSaturdayRescheduled ? existingPlan!.schedule.saturday.focus : 'Safe Progressive Long Run',
    originalFocus: 'Safe Progressive Long Run',
    targetMetric: isSaturdayRescheduled
      ? existingPlan!.schedule.saturday.targetMetric
      : '6.5 km - 7.0 km • Pace 8:15 - 8:40/km',
    details: isSaturdayRescheduled
      ? existingPlan!.schedule.saturday.details
      : 'Lari jarak jauh murni di Zona 2 (conversational pace). Kenaikan jarak terkontrol agar aman dari risiko cedera sendi dan tulang kering.',
    intensityBadge: 'Endurance',
    status: saturdayStatus,
    isAdjusted: saturdayIsAdjusted || (isSaturdayRescheduled ? true : false),
    adjustmentReason: saturdayAdjustmentReason || (isSaturdayRescheduled ? existingPlan!.schedule.saturday.adjustmentReason : null),
    completedActivity: saturdayCompletedAct,
  };

  let activeAdjustmentNote: string | null = null;

  // ATURAN RECOVERY 1: Jika atlet baru saja lari di hari Jumat, proteksi sesi Sabtu!
  if (fridayRun && saturdayStatus !== 'completed' && !isSaturdayRescheduled) {
    saturdayWorkout.isAdjusted = true;
    saturdayWorkout.focus = 'Active Recovery & Mobilisasi (Long Run Geser ke Minggu)';
    saturdayWorkout.targetMetric = '25-30 Menit Jalan Santai / Foam Rolling & Dinamis';
    saturdayWorkout.details =
      'Penyesuaian Jeda Istirahat (Recovery Window): Anda baru saja menyelesaikan lari hari Jumat. Berikan jeda 48 jam sebelum Long Run di hari MINGGU agar simpanan glikogen pulih dan sendi terhindar dari cedera akibat lari berturut-turut.';
    saturdayWorkout.adjustmentReason =
      'Lari dilakukan hari Jumat. Sesi Long Run dialihkan ke hari Minggu untuk memastikan jeda istirahat 48 jam.';
    activeAdjustmentNote =
      'Sesi lari Jumat terdeteksi. Sesi Long Run dialihkan ke hari Minggu untuk menjaga pemulihan optimal.';
  }

  // ATURAN RECOVERY 2: Jika terdeteksi Leg Day dalam 24-36 jam terakhir
  if (recentLegDay) {
    if (currentDayOfWeek === 4 && thursdayStatus !== 'completed' && !isThursdayRescheduled) {
      thursdayWorkout.isAdjusted = true;
      thursdayWorkout.intensityBadge = 'Moderate';
      thursdayWorkout.targetMetric = '4.0 km Santai di Zona 2 (Pace Conversational)';
      thursdayWorkout.details =
        'Penyesuaian Pasca Leg Day: Terdeteksi latihan beban kaki baru-baru ini. Intensitas interval diringankan ke lari pemulihan Zona 2 untuk melancarkan asam laktat tanpa menambah beban stres mikro-otot.';
      thursdayWorkout.adjustmentReason = 'Disesuaikan karena latihan beban kaki (Leg Day) terdeteksi dalam 48 jam terakhir.';
    }
  }

  // ATURAN SMART SKIP 1: Jika awal minggu (Senin & Selasa) terlewat, dan Kamis belum selesai
  if (mondayStatus === 'skipped' && thursdayStatus !== 'completed' && !isThursdayRescheduled) {
    thursdayWorkout.isAdjusted = true;
    thursdayWorkout.focus = 'Aerobic Interval & Cruise Tempo (Penyesuaian Adaptif)';
    thursdayWorkout.targetMetric = '5.5 km • 4x 400m Interval + 1.5 km Cruise Tempo';
    thursdayWorkout.details =
      'Penyesuaian karena sesi awal minggu terlewat: Pemanasan 1.5 km aerobik, 4 repetisi interval 400m cepat (Pace 6:50), dilanjutkan 1.5 km cruise tempo di pace 7:45/km. Mengganti stimulasi aerobik yang hilang secara aman tanpa membuat otot stres berlebihan.';
    thursdayWorkout.adjustmentReason =
      'Sesi awal minggu terlewat. Kamis diadaptasi menggabungkan interval dengan cruise tempo agar stimulasi ambang laktat tetap tercapai.';
    activeAdjustmentNote =
      'Jadwal awal minggu terlewat. Rekomendasi Kamis telah disesuaikan dengan penambahan volume aerobik moderat yang aman.';
  }

  // ATURAN SMART SKIP 2: Jika tengah minggu (Kamis & Jumat) terlewat, dan Sabtu belum selesai
  if (thursdayStatus === 'skipped' && saturdayStatus !== 'completed' && !isSaturdayRescheduled) {
    saturdayWorkout.isAdjusted = true;
    saturdayWorkout.focus = 'Progressive Long Run (Penyesuaian Adaptif)';
    saturdayWorkout.targetMetric = '7.0 km • 5 km Zone 2 + 2 km Tempo Finish';
    saturdayWorkout.details =
      'Penyesuaian karena sesi interval tengah minggu terlewat: Lari 5 km awal di Zone 2 stabil (Pace 8:20/km), lalu tutup 2 km terakhir dengan akselerasi Tempo Finish (Pace 7:30/km). Ini menyerap stimulasi anaerobik yang hilang tanpa memicu risiko cedera sendi.';
    saturdayWorkout.adjustmentReason =
      'Sesi interval tengah minggu terlewat. Target Sabtu diadaptasi menjadi Progressive Long Run agar stimulasi kardio dan ambang laktat tetap tercapai proporsional.';
    activeAdjustmentNote =
      'Jadwal tengah minggu terlewat. Rekomendasi Sabtu disesuaikan menjadi Progressive Long Run dengan akselerasi akhir yang aman.';
  }

  // ATURAN SMART SKIP 3: Jika Senin DAN Kamis terlewat
  if (mondayStatus === 'skipped' && thursdayStatus === 'skipped' && saturdayStatus !== 'completed' && !isSaturdayRescheduled) {
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

  // Prioritas Catatan Reschedule Manual atau Pergeseran Adaptif
  if (isMondayRescheduled || isThursdayRescheduled || isSaturdayRescheduled) {
    activeAdjustmentNote =
      existingPlan?.smartSkipAudit?.activeAdjustmentNote ||
      'Penyesuaian Adaptif Aktif: Sesi latihan telah dialihkan sesuai kendala atlet.';
  } else if (adaptiveShifts.length > 0 && !activeAdjustmentNote) {
    activeAdjustmentNote = adaptiveShifts.map((s) => s.note).join(' • ');
  }

  // Tentukan Next Workout Day secara cerdas
  let nextWorkoutDay: CoachPlanData['nextWorkoutDay'];
  if (currentDayOfWeek === 1) {
    if (isMondayRescheduled) {
      nextWorkoutDay = {
        dayName: existingPlan?.nextWorkoutDay?.dayName || 'Selasa',
        label: 'AI Rescheduled',
        focus: mondayWorkout.focus,
        summary: mondayWorkout.details,
        targetMetric: mondayWorkout.targetMetric,
        isAdjusted: true,
        adjustmentBadge: existingPlan?.nextWorkoutDay?.adjustmentBadge || 'AI Rescheduled',
      };
    } else {
      nextWorkoutDay = {
        dayName: 'Senin',
        label: mondayStatus === 'completed' ? 'Tuntas Hari Ini' : 'Hari Ini',
        focus: mondayWorkout.focus,
        summary: mondayWorkout.details,
        targetMetric: mondayWorkout.targetMetric,
        isAdjusted: !!mondayWorkout.isAdjusted,
        adjustmentBadge: mondayWorkout.isAdjusted ? 'Penyesuaian Adaptif' : null,
      };
    }
  } else if (currentDayOfWeek === 2) {
    // Hari Selasa
    if (mondayStatus === 'completed') {
      nextWorkoutDay = {
        dayName: 'Kamis',
        label: 'Sesi Terdekat',
        focus: thursdayWorkout.focus,
        summary: thursdayWorkout.details,
        targetMetric: thursdayWorkout.targetMetric,
        isAdjusted: !!thursdayWorkout.isAdjusted,
        adjustmentBadge: null,
      };
    } else {
      nextWorkoutDay = {
        dayName: 'Selasa',
        label: 'Hari Ini (Jendela Adaptif)',
        focus: mondayWorkout.focus,
        summary: 'Sesi awal minggu dapat dieksekusi hari ini agar ritme 3 hari tetap terjaga.',
        targetMetric: mondayWorkout.targetMetric,
        isAdjusted: true,
        adjustmentBadge: 'Sesi Fleksibel',
      };
    }
  } else if (currentDayOfWeek === 3) {
    // Hari Rabu
    nextWorkoutDay = {
      dayName: 'Kamis',
      label: thursdayStatus === 'completed' ? 'Tuntas Kemarin' : 'Besok',
      focus: thursdayWorkout.focus,
      summary: thursdayWorkout.details,
      targetMetric: thursdayWorkout.targetMetric,
      isAdjusted: !!thursdayWorkout.isAdjusted,
      adjustmentBadge: thursdayWorkout.isAdjusted ? 'Penyesuaian Adaptif' : null,
    };
  } else if (currentDayOfWeek === 4) {
    // Hari Kamis
    if (isThursdayRescheduled) {
      nextWorkoutDay = {
        dayName: existingPlan?.nextWorkoutDay?.dayName || 'Jumat',
        label: 'AI Rescheduled',
        focus: thursdayWorkout.focus,
        summary: thursdayWorkout.details,
        targetMetric: thursdayWorkout.targetMetric,
        isAdjusted: true,
        adjustmentBadge: existingPlan?.nextWorkoutDay?.adjustmentBadge || 'AI Rescheduled',
      };
    } else {
      nextWorkoutDay = {
        dayName: 'Kamis',
        label: thursdayStatus === 'completed' ? 'Tuntas Hari Ini' : 'Hari Ini',
        focus: thursdayWorkout.focus,
        summary: thursdayWorkout.details,
        targetMetric: thursdayWorkout.targetMetric,
        isAdjusted: !!thursdayWorkout.isAdjusted,
        adjustmentBadge: thursdayWorkout.isAdjusted ? 'Penyesuaian Adaptif' : null,
      };
    }
  } else if (currentDayOfWeek === 5) {
    // Hari Jumat
    if (thursdayStatus === 'completed') {
      nextWorkoutDay = {
        dayName: fridayRun ? 'Minggu' : 'Sabtu',
        label: 'Sesi Terdekat',
        focus: saturdayWorkout.focus,
        summary: saturdayWorkout.details,
        targetMetric: saturdayWorkout.targetMetric,
        isAdjusted: !!saturdayWorkout.isAdjusted,
        adjustmentBadge: saturdayWorkout.isAdjusted ? 'Penyesuaian Adaptif' : null,
      };
    } else {
      nextWorkoutDay = {
        dayName: 'Jumat',
        label: 'Hari Ini (Jendela Adaptif)',
        focus: thursdayWorkout.focus,
        summary: 'Eksekusi sesi interval tengah minggu hari ini sebelum akhir pekan.',
        targetMetric: thursdayWorkout.targetMetric,
        isAdjusted: true,
        adjustmentBadge: 'Sesi Fleksibel',
      };
    }
  } else if (currentDayOfWeek === 6) {
    // Hari Sabtu
    if (isSaturdayRescheduled) {
      nextWorkoutDay = {
        dayName: existingPlan?.nextWorkoutDay?.dayName || 'Minggu',
        label: 'AI Rescheduled',
        focus: saturdayWorkout.focus,
        summary: saturdayWorkout.details,
        targetMetric: saturdayWorkout.targetMetric,
        isAdjusted: true,
        adjustmentBadge: existingPlan?.nextWorkoutDay?.adjustmentBadge || 'AI Rescheduled',
      };
    } else {
      nextWorkoutDay = {
        dayName: 'Sabtu',
        label: saturdayStatus === 'completed' ? 'Tuntas Hari Ini' : 'Hari Ini',
        focus: saturdayWorkout.focus,
        summary: saturdayWorkout.details,
        targetMetric: saturdayWorkout.targetMetric,
        isAdjusted: !!saturdayWorkout.isAdjusted,
        adjustmentBadge: saturdayWorkout.isAdjusted ? 'Penyesuaian Adaptif' : null,
      };
    }
  } else {
    // Hari Minggu (0)
    if (saturdayStatus !== 'completed') {
      nextWorkoutDay = {
        dayName: 'Minggu',
        label: sundayRun ? 'Tuntas Hari Ini' : 'Hari Ini (Jendela Akhir Pekan)',
        focus: saturdayWorkout.focus,
        summary: 'Tuntaskan sesi Long Run akhir pekan Anda hari ini di Zona 2.',
        targetMetric: saturdayWorkout.targetMetric,
        isAdjusted: true,
        adjustmentBadge: 'Jendela Long Run',
      };
    } else {
      nextWorkoutDay = {
        dayName: 'Senin',
        label: 'Sesi Terdekat (Minggu Depan)',
        focus: 'Tempo / Speed Run',
        summary: 'Persiapan sesi awal minggu baru dengan energi penuh.',
        targetMetric: '4.5 km - 5.0 km • Pace 7:15 - 7:30/km',
        isAdjusted: false,
        adjustmentBadge: null,
      };
    }
  }

  // ==========================================
  // ARAHAN HARIAN REAL-TIME (todayDynamicDirective)
  // Menentukan arahan paling akurat untuk ditampilkan di banner dashboard hari ini
  // ==========================================
  let todayDynamicDirective: CoachPlanData['todayDynamicDirective'];

  if (todayRun) {
    // 1. Atlet sudah berlari hari ini
    const distKm = Number(((todayRun.distanceMeters || 0) / 1000).toFixed(2));
    const paceStr = todayRun.avgPaceSecPerKm
      ? `${Math.floor(todayRun.avgPaceSecPerKm / 60)}'${Math.round(todayRun.avgPaceSecPerKm % 60)
          .toString()
          .padStart(2, '0')}"/km`
      : 'Pace Terkontrol';

    todayDynamicDirective = {
      dayName: todayWibName,
      focus: 'Sesi Hari Ini Tuntas! 🏆',
      targetMetric: `${distKm} km • ${paceStr}`,
      details: `Luar biasa! Target latihan lari hari ini telah terpenuhi (${todayRun.title}). Prioritaskan rehidrasi elektrolit 400ml, asupan protein 25-30g, dan peregangan statis untuk pemulihan optimal.`,
      badge: 'Tuntas Hari Ini',
      isRecovery: true,
      reason: 'Sesi lari hari ini telah tercatat di sistem.',
    };
  } else if (yesterdayRun && currentDayOfWeek !== 1 && currentDayOfWeek !== 4 && currentDayOfWeek !== 6) {
    // 2. Kemarin baru saja lari, hari ini bukan hari anchor lari
    todayDynamicDirective = {
      dayName: todayWibName,
      focus: 'Active Recovery & Otot Mobilisasi',
      targetMetric: '20-30 Menit Jalan Santai / Foam Rolling',
      details: `Pemulihan Aktif Pasca Lari Kemarin (${yesterdayRun.title}): Hari ini fokuskan pada sirkulasi limfatik tanpa hentakan keras agar otot dan sendi pulih sempurna menyambut sesi berikutnya.`,
      badge: 'Active Recovery',
      isRecovery: true,
      reason: 'Jeda istirahat 24-48 jam pasca lari kemarin.',
    };
  } else if (yesterdayLegDay && (currentDayOfWeek === 4 || currentDayOfWeek === 1)) {
    // 3. Kemarin Leg Day, hari ini jadwal anchor
    todayDynamicDirective = {
      dayName: todayWibName,
      focus: 'Injury Guard: Aerobic Base (Zona 2)',
      targetMetric: '3.5 km - 4.0 km Santai di Zona 2 (Pace Percakapan)',
      details: `Proteksi Pasca Leg Day Kemarin: Otot paha sedang dalam fase perbaikan mikro. Hindari sprint cepat hari ini, prioritaskan lari santai untuk melancarkan sirkulasi tanpa menambah beban stres sendi.`,
      badge: 'Injury Guard Scaled',
      isRecovery: false,
      reason: 'Sesi Leg Day terdeteksi kemarin.',
    };
  } else if (currentDayOfWeek === 1) {
    // 4. Hari Senin (Anchor 1)
    todayDynamicDirective = {
      dayName: 'Senin',
      focus: mondayWorkout.focus,
      targetMetric: mondayWorkout.targetMetric,
      details: mondayWorkout.details,
      badge: mondayWorkout.isAdjusted ? 'Adaptive Speed Run' : 'Jadwal Kunci Speed',
      isRecovery: false,
      reason: mondayWorkout.adjustmentReason || null,
    };
  } else if (currentDayOfWeek === 4) {
    // 5. Hari Kamis (Anchor 2)
    todayDynamicDirective = {
      dayName: 'Kamis',
      focus: thursdayWorkout.focus,
      targetMetric: thursdayWorkout.targetMetric,
      details: thursdayWorkout.details,
      badge: thursdayWorkout.isAdjusted ? 'Adaptive Interval' : 'Jadwal Kunci VO2Max',
      isRecovery: false,
      reason: thursdayWorkout.adjustmentReason || null,
    };
  } else if (currentDayOfWeek === 6) {
    // 6. Hari Sabtu (Anchor 3)
    todayDynamicDirective = {
      dayName: 'Sabtu',
      focus: saturdayWorkout.focus,
      targetMetric: saturdayWorkout.targetMetric,
      details: saturdayWorkout.details,
      badge: saturdayWorkout.isAdjusted ? 'Adaptive Long Run' : 'Jadwal Kunci Endurance',
      isRecovery: false,
      reason: saturdayWorkout.adjustmentReason || null,
    };
  } else if (currentDayOfWeek === 2 && mondayStatus !== 'completed') {
    // 7. Hari Selasa dan Senin belum lari
    todayDynamicDirective = {
      dayName: 'Selasa',
      focus: 'Sesi Pengganti Awal Minggu: Tempo Run (Fleksibel)',
      targetMetric: mondayWorkout.targetMetric,
      details: 'Jendela adaptif terbuka: Manfaatkan hari Selasa untuk mengeksekusi sesi tempo awal minggu agar jadwal 3 hari tetap tercapai.',
      badge: 'Adaptive Run Opportunity',
      isRecovery: false,
      reason: 'Menggantikan sesi lari Senin yang belum dieksekusi.',
    };
  } else if (currentDayOfWeek === 5 && thursdayStatus !== 'completed') {
    // 8. Hari Jumat dan Kamis belum lari
    todayDynamicDirective = {
      dayName: 'Jumat',
      focus: 'Sesi Pengganti Tengah Minggu: Interval Run (Fleksibel)',
      targetMetric: thursdayWorkout.targetMetric,
      details: 'Jendela adaptif terbuka: Eksekusi sesi interval tengah minggu hari ini sebelum akhir pekan.',
      badge: 'Adaptive Run Opportunity',
      isRecovery: false,
      reason: 'Menggantikan sesi interval Kamis yang belum dieksekusi.',
    };
  } else if (currentDayOfWeek === 0 && saturdayStatus !== 'completed') {
    // 9. Hari Minggu dan Sabtu belum lari
    todayDynamicDirective = {
      dayName: 'Minggu',
      focus: 'Sesi Long Run Akhir Pekan (Jendela Minggu)',
      targetMetric: saturdayWorkout.targetMetric,
      details: 'Jendela adaptif akhir pekan: Eksekusi Long Run hari ini dengan santai di Zona 2 (conversational pace).',
      badge: 'Weekend Long Run',
      isRecovery: false,
      reason: 'Menuntaskan Long Run akhir pekan di hari Minggu.',
    };
  } else {
    // 10. Hari Non-Lari Normal (Cross training / Active Recovery)
    const defaultSchedule = DEFAULT_WEEKLY_SCHEDULES[currentDayOfWeek] || DEFAULT_WEEKLY_SCHEDULES[2];
    todayDynamicDirective = {
      dayName: todayWibName,
      focus: defaultSchedule.focus,
      targetMetric: defaultSchedule.targetMetric,
      details: defaultSchedule.details,
      badge: defaultSchedule.badge,
      isRecovery: !defaultSchedule.isKey,
      reason: null,
    };
  }

  const smartSkipAudit: SmartSkipAudit = {
    hasSkippedDays,
    skippedDayNames,
    activeAdjustmentNote,
    crossTrainingNotice,
    adaptiveShifts: adaptiveShifts.length > 0 ? adaptiveShifts : undefined,
    auditDetails: {
      monday: {
        status: mondayStatus,
        dateLabel: mondayInfo.dateLabel,
        fulfilledOn: mondayFulfilledOn,
      },
      thursday: {
        status: thursdayStatus,
        dateLabel: thursdayInfo.dateLabel,
        fulfilledOn: thursdayFulfilledOn,
      },
      saturday: {
        status: saturdayStatus,
        dateLabel: saturdayInfo.dateLabel,
        fulfilledOn: saturdayFulfilledOn,
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
    todayDynamicDirective,
  };
}

export function parseCoachPlanFromInsight(
  insight: {
    id: string;
    periodStart: Date | string;
    periodEnd: Date | string;
    summary: string;
    strengths: string;
    recommendations: string;
    createdAt: Date | string;
  },
  activities: ActivityData[] = []
): AiInsightData {
  let coachPlan: CoachPlanData | null = null;

  try {
    if (insight.recommendations && insight.recommendations.trim().startsWith('{')) {
      coachPlan = JSON.parse(insight.recommendations) as CoachPlanData;
    }
  } catch {
    // Fallback if parsing fails
  }

  // Jika activities disediakan atau coachPlan belum lengkap, lakukan audit adaptif dinamis
  if (activities.length > 0 || !coachPlan || !coachPlan.smartSkipAudit) {
    const auditRes = auditScheduleAndAdaptivePlan(activities, coachPlan);
    if (!coachPlan) {
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
        todayDynamicDirective: auditRes.todayDynamicDirective,
      };
    } else {
      // Sinkronkan audit jadwal dan arahan hari ini dengan aktivitas riil terbaru
      coachPlan.smartSkipAudit = auditRes.smartSkipAudit;
      coachPlan.nextWorkoutDay = auditRes.nextWorkoutDay;
      coachPlan.schedule = auditRes.schedule;
      coachPlan.todayDynamicDirective = auditRes.todayDynamicDirective;
    }
  }

  return {
    ...insight,
    coachPlan,
  };
}

export async function generateWeeklyPerformanceInsight(userId: string): Promise<AiInsightData> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 14); // Ambil 14 hari terakhir untuk audit skip dan fatik

  let activities: ActivityData[] = [];
  let weightLogs: WeightLogData[] = [];

  let existingPlan: CoachPlanData | null = null;

  try {
    const [rawActs, rawWeights, latestInsight] = await Promise.all([
      prisma.activity.findMany({
        where: {
          userId,
          startTime: { gte: oneWeekAgo },
        },
        orderBy: { startTime: 'asc' },
      }),
      prisma.weightLog.findMany({
        where: {
          userId,
          loggedAt: { gte: oneWeekAgo },
        },
        orderBy: { loggedAt: 'asc' },
      }),
      prisma.aiInsight.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    activities = rawActs.map((a) => ({
      ...a,
      stravaActivityId: a.stravaActivityId ? a.stravaActivityId.toString() : null,
      gymSets: (a.gymSets as unknown as GymSet[]) || null,
    }));

    weightLogs = rawWeights;

    if (latestInsight) {
      existingPlan = parseCoachPlanFromInsight(latestInsight, activities).coachPlan || null;
    }
  } catch (dbErr) {
    console.warn('Prisma DB query fallback in insights service:', dbErr);
  }

  // Hitung audit jadwal dan penyesuaian cerdas (Truly Adaptive Anchor Engine)
  const auditResult = auditScheduleAndAdaptivePlan(activities, existingPlan);

  const promptData = {
    anchorDays: [
      'SENIN (Speed/Tempo Run - Fleksibel jendela Senin/Selasa)',
      'KAMIS (Interval/VO2Max - Fleksibel jendela Rabu/Kamis/Jumat)',
      'SABTU (Progressive Long Run - Fleksibel jendela Sabtu/Minggu)',
    ],
    scheduleAudit: auditResult.smartSkipAudit,
    nextWorkoutRecommendation: auditResult.nextWorkoutDay,
    adaptiveWorkouts: auditResult.schedule,
    todayDynamicDirective: auditResult.todayDynamicDirective,
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
      Anda adalah seorang Pelatih Lari Adaptif Profesional dan Sports Scientist kelas dunia untuk FitAI.
      
      Filosofi Pelatihan Atlet (Adaptive Anchor System):
      1. Prioritas Utama (Anchor Days): Jadwal patokan utama atlet adalah SENIN (Tempo/Speed), KAMIS (Interval VO2Max), dan SABTU (Progressive Long Run).
      2. Fleksibilitas Penuh (Truly Adaptive):
         - Jika atlet berlari di hari lain (misal: Selasa menggantikan Senin, Rabu/Jumat menggantikan Kamis, atau Minggu menggantikan Sabtu), AKUISISI dan apresiasi sesi tersebut sebagai pemenuhan target mingguan! JANGAN menghukum atau menganggap atlet "bolos/terlewat".
         - Jendela Pemulihan (Recovery Window): Perhatikan jeda minimal 36-48 jam setelah sesi intensitas tinggi. Jika atlet lari di hari Jumat, sesi Sabtu diselaraskan atau dialihkan ke Minggu.
         - Waspada Aktivitas Non-Lari (Cross-Training): Jika terdeteksi sesi latihan beban kaki (Leg Day) atau bersepeda berat, otomatis sesuaikan target lari berikutnya agar aman dari risiko cedera tendon dan overtraining.
         - ATURAN RESCHEDULE MANUAL: Pertahankan seluruh penyesuaian yang berstatus 'rescheduled'.
      3. Nada bicara: TEGAS, SUPORTIF, CERDAS, MEMBAKAR SEMANGAT, seperti pelatih elit pribadi atlet.

      Kembalikan HANYA format JSON valid dengan struktur:
      {
        "coachGreeting": "string (komentar pembuka langsung dari coach, tegas & memotivasi, sebutkan jika ada penyesuaian adaptif atau pemulihan)",
        "intensityVerdict": "Kurang (Under-training)" | "Pas (Balanced)" | "Terlalu Berat (Over-training)",
        "lastWeekAnalysis": "string (analisis sesi minggu lalu, missed runs, pace stabilitas, atau beban gym)",
        "smartSkipAudit": {
          "hasSkippedDays": boolean,
          "skippedDayNames": string[],
          "activeAdjustmentNote": "string atau null",
          "crossTrainingNotice": "string atau null",
          "auditDetails": {
            "monday": { "status": "completed" | "skipped" | "upcoming" | "today" | "rescheduled", "dateLabel": "string", "fulfilledOn": "string opsional" },
            "thursday": { "status": "completed" | "skipped" | "upcoming" | "today" | "rescheduled", "dateLabel": "string", "fulfilledOn": "string opsional" },
            "saturday": { "status": "completed" | "skipped" | "upcoming" | "today" | "rescheduled", "dateLabel": "string", "fulfilledOn": "string opsional" }
          }
        },
        "nextWorkoutDay": {
          "dayName": "string",
          "label": "string",
          "focus": "string",
          "summary": "string ringkas menu lari terdekat",
          "targetMetric": "string",
          "isAdjusted": boolean,
          "adjustmentBadge": "string atau null"
        },
        "schedule": {
          "monday": {
            "dayName": "Senin",
            "focus": "string",
            "targetMetric": "string",
            "details": "string panduan",
            "intensityBadge": "High",
            "status": "completed" | "skipped" | "upcoming" | "today" | "rescheduled",
            "isAdjusted": boolean,
            "adjustmentReason": "string atau null"
          },
          "thursday": {
            "dayName": "Kamis",
            "focus": "string",
            "targetMetric": "string",
            "details": "string panduan",
            "intensityBadge": "High",
            "status": "completed" | "skipped" | "upcoming" | "today" | "rescheduled",
            "isAdjusted": boolean,
            "adjustmentReason": "string atau null"
          },
          "saturday": {
            "dayName": "Sabtu",
            "focus": "string",
            "targetMetric": "string",
            "details": "string panduan",
            "intensityBadge": "Endurance",
            "status": "completed" | "skipped" | "upcoming" | "today" | "rescheduled",
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
          geminiPlan.todayDynamicDirective = auditResult.todayDynamicDirective;
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
    if (auditResult.smartSkipAudit.adaptiveShifts && auditResult.smartSkipAudit.adaptiveShifts.length > 0) {
      const shiftDesc = auditResult.smartSkipAudit.adaptiveShifts.map((s) => s.note).join(' ');
      greeting = `Adaptasi Aktif: ${shiftDesc} Ritme latihan mingguan Anda tetap terjaga secara proporsional.`;
    } else if (auditResult.smartSkipAudit.crossTrainingNotice) {
      greeting = `Perhatian Pelatih: ${auditResult.smartSkipAudit.crossTrainingNotice}`;
    } else if (auditResult.smartSkipAudit.hasSkippedDays) {
      const skippedStr = auditResult.smartSkipAudit.skippedDayNames.join(', ');
      greeting = `Perhatian atlet: Sesi ${skippedStr} terlewat. Jangan cemas, sistem pelatih kami telah otomatis menyesuaikan target lari berikutnya agar Anda tetap berkembang tanpa risiko cedera.`;
    } else {
      greeting =
        'Kerja bagus! Anda disiplin menjaga ritme latihan mingguan. Pertahankan konsistensi ini untuk mengunci hasil maksimal.';
    }

    parsedPlan = {
      coachGreeting: greeting,
      intensityVerdict: verdict,
      lastWeekAnalysis: `Tercatat ${runCount} sesi lari dalam rentang observasi. ${
        auditResult.smartSkipAudit.activeAdjustmentNote ||
        auditResult.smartSkipAudit.crossTrainingNotice ||
        'Ritme latihan sedang berjalan dinamis sesuai kondisi tubuh.'
      }`,
      smartSkipAudit: auditResult.smartSkipAudit,
      nextWorkoutDay: auditResult.nextWorkoutDay,
      schedule: auditResult.schedule,
      todayDynamicDirective: auditResult.todayDynamicDirective,
      recoveryAdvice: {
        nutrition:
          'Konsumsi 1 pisang atau selembar roti gandum 45 menit sebelum lari pagi untuk cadangan glikogen otot, plus 350ml air putih.',
        restAndGym:
          'Beri jeda minimal 24-48 jam antara sesi latihan beban kaki (leg day) dan lari intensitas tinggi untuk mencegah kelelahan otot dan kram.',
        proteinRecommendation:
          'Targetkan minimal 110 - 130 gram protein harian untuk pemulihan dan penguatan serabut otot pasca latihan.',
      },
    };
  }

  const activePlan: CoachPlanData = parsedPlan;

  // Preservasi mutlak terhadap sesi yang di-reschedule manual oleh atlet agar tidak hilang saat refresh insight
  if (activePlan) {
    if (auditResult.schedule.monday.status === 'rescheduled') {
      activePlan.schedule.monday = auditResult.schedule.monday;
    }
    if (auditResult.schedule.thursday.status === 'rescheduled') {
      activePlan.schedule.thursday = auditResult.schedule.thursday;
    }
    if (auditResult.schedule.saturday.status === 'rescheduled') {
      activePlan.schedule.saturday = auditResult.schedule.saturday;
    }

    const hasRescheduledSession =
      auditResult.schedule.monday.status === 'rescheduled' ||
      auditResult.schedule.thursday.status === 'rescheduled' ||
      auditResult.schedule.saturday.status === 'rescheduled';

    if (hasRescheduledSession) {
      activePlan.smartSkipAudit = auditResult.smartSkipAudit;
      activePlan.nextWorkoutDay = auditResult.nextWorkoutDay;
      if (auditResult.smartSkipAudit.activeAdjustmentNote && !activePlan.coachGreeting.includes('dialihkan')) {
        activePlan.coachGreeting = `Perhatian Pelatih: ${auditResult.smartSkipAudit.activeAdjustmentNote} ${activePlan.coachGreeting}`;
      }
    }

    if (!activePlan.todayDynamicDirective) {
      activePlan.todayDynamicDirective = auditResult.todayDynamicDirective;
    }
  }

  const rawRecommendations = JSON.stringify(activePlan);
  const summary = activePlan.coachGreeting;
  const strengths = `${activePlan.intensityVerdict}: ${activePlan.lastWeekAnalysis}`;

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
      coachPlan: activePlan,
    };
  } catch (err) {
    console.warn('Prisma create insight fallback:', err);
    return {
      ...insightRecord,
      coachPlan: activePlan,
    };
  }
}
