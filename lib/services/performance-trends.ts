import { ActivityData, PerformanceTrend, ProgressiveTargets, WeeklySnapshot } from '@/types';
import { getWibParts, getWibDateString } from '@/lib/timezone';

/**
 * Format detik pace ke string "M'SS"/km"
 */
function formatPace(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}'${sec.toString().padStart(2, '0')}"/km`;
}

/**
 * Menghitung snapshot per minggu dari data aktivitas lari
 * Rolling window: N minggu ke belakang dari hari ini
 */
export function calculateWeeklySnapshots(
  activities: ActivityData[],
  weeksBack: number = 6
): WeeklySnapshot[] {
  const now = new Date();
  const { year, month, day } = getWibParts(now);

  // Hitung Senin di minggu berjalan
  const currentDayOfWeek = now.getDay(); // 0=Sun
  const distToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

  const snapshots: WeeklySnapshot[] = [];

  for (let w = 0; w < weeksBack; w++) {
    const mondayOffset = distToMonday - w * 7;
    const sundayOffset = mondayOffset + 6;

    const mondayDate = new Date(Date.UTC(year, month - 1, day + mondayOffset, 0, 0, 0));
    const sundayDate = new Date(Date.UTC(year, month - 1, day + sundayOffset, 23, 59, 59));

    const mondayStr = getWibDateString(mondayDate);
    const sundayStr = getWibDateString(sundayDate);

    // Filter aktivitas lari dalam rentang minggu ini
    const weekRuns = activities.filter((a) => {
      if (a.type !== 'RUN') return false;
      const actDateStr = getWibDateString(new Date(a.startTime));
      return actDateStr >= mondayStr && actDateStr <= sundayStr;
    });

    const totalDistKm = weekRuns.reduce((acc, a) => acc + ((a.distanceMeters || 0) / 1000), 0);
    const totalElevation = weekRuns.reduce((acc, a) => acc + (a.elevationGainM || 0), 0);
    const totalCalories = weekRuns.reduce((acc, a) => acc + (a.calories || 0), 0);

    // Rata-rata pace (hanya dari aktivitas yang punya data pace)
    const runsWithPace = weekRuns.filter((a) => a.avgPaceSecPerKm && a.avgPaceSecPerKm > 0);
    const avgPace =
      runsWithPace.length > 0
        ? runsWithPace.reduce((acc, a) => acc + (a.avgPaceSecPerKm || 0), 0) / runsWithPace.length
        : null;

    // Rata-rata HR
    const runsWithHr = weekRuns.filter((a) => a.avgHeartRate && a.avgHeartRate > 0);
    const avgHr =
      runsWithHr.length > 0
        ? Math.round(runsWithHr.reduce((acc, a) => acc + (a.avgHeartRate || 0), 0) / runsWithHr.length)
        : null;

    const mondayFormatted = mondayDate.toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
    });
    const sundayFormatted = sundayDate.toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
    });

    snapshots.push({
      weekLabel: `Minggu ${weeksBack - w} (${mondayFormatted} - ${sundayFormatted})`,
      weekStart: mondayStr,
      totalRunDistanceKm: Number(totalDistKm.toFixed(2)),
      totalRunCount: weekRuns.length,
      avgPaceSecPerKm: avgPace ? Math.round(avgPace) : null,
      avgHeartRate: avgHr,
      totalElevationGainM: Number(totalElevation.toFixed(1)),
      totalCalories: Math.round(totalCalories),
    });
  }

  // Urutkan dari minggu terlama ke terbaru
  return snapshots.reverse();
}

/**
 * Menganalisis trend performa dari weekly snapshots
 */
export function analyzePerformanceTrend(snapshots: WeeklySnapshot[]): PerformanceTrend {
  const weeksWithRuns = snapshots.filter((w) => w.totalRunCount > 0);

  if (weeksWithRuns.length < 2) {
    return {
      weeks: snapshots,
      paceTrendDirection: 'stable',
      paceDeltaSecPerKm: 0,
      volumeTrendDirection: 'stable',
      volumeDeltaPercent: 0,
      avgHrTrend: null,
      weeklyVolumeRampPercent: 0,
      rampWarning: false,
      summary: 'Data latihan belum cukup untuk analisis trend (minimal 2 minggu aktif diperlukan).',
    };
  }

  // Pace trend: bandingkan rata-rata paruh pertama vs paruh kedua
  const mid = Math.floor(weeksWithRuns.length / 2);
  const firstHalf = weeksWithRuns.slice(0, mid).filter((w) => w.avgPaceSecPerKm !== null);
  const secondHalf = weeksWithRuns.slice(mid).filter((w) => w.avgPaceSecPerKm !== null);

  let paceDelta = 0;
  let paceDir: PerformanceTrend['paceTrendDirection'] = 'stable';
  if (firstHalf.length > 0 && secondHalf.length > 0) {
    const avgFirst = firstHalf.reduce((a, w) => a + (w.avgPaceSecPerKm || 0), 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, w) => a + (w.avgPaceSecPerKm || 0), 0) / secondHalf.length;
    paceDelta = Math.round(avgSecond - avgFirst); // negative = faster = improving
    if (paceDelta <= -5) paceDir = 'improving';
    else if (paceDelta >= 5) paceDir = 'declining';
    else paceDir = 'stable';
  }

  // Volume trend
  const firstHalfVol = weeksWithRuns.slice(0, mid);
  const secondHalfVol = weeksWithRuns.slice(mid);
  const avgVolFirst =
    firstHalfVol.reduce((a, w) => a + w.totalRunDistanceKm, 0) / firstHalfVol.length;
  const avgVolSecond =
    secondHalfVol.reduce((a, w) => a + w.totalRunDistanceKm, 0) / secondHalfVol.length;
  const volDelta =
    avgVolFirst > 0 ? Math.round(((avgVolSecond - avgVolFirst) / avgVolFirst) * 100) : 0;
  let volDir: PerformanceTrend['volumeTrendDirection'] = 'stable';
  if (volDelta >= 10) volDir = 'increasing';
  else if (volDelta <= -10) volDir = 'decreasing';

  // Weekly volume ramp (current vs previous)
  const currentWeek = weeksWithRuns[weeksWithRuns.length - 1];
  const prevWeek = weeksWithRuns.length >= 2 ? weeksWithRuns[weeksWithRuns.length - 2] : null;
  let weeklyRamp = 0;
  if (prevWeek && prevWeek.totalRunDistanceKm > 0) {
    weeklyRamp = Math.round(
      ((currentWeek.totalRunDistanceKm - prevWeek.totalRunDistanceKm) / prevWeek.totalRunDistanceKm) * 100
    );
  }
  const rampWarning = weeklyRamp > 10;

  // HR trend
  const firstHalfHr = firstHalf.filter((w) => w.avgHeartRate !== null);
  const secondHalfHr = secondHalf.filter((w) => w.avgHeartRate !== null);
  let hrTrend: PerformanceTrend['avgHrTrend'] = null;
  if (firstHalfHr.length > 0 && secondHalfHr.length > 0) {
    const avgHrFirst = firstHalfHr.reduce((a, w) => a + (w.avgHeartRate || 0), 0) / firstHalfHr.length;
    const avgHrSecond = secondHalfHr.reduce((a, w) => a + (w.avgHeartRate || 0), 0) / secondHalfHr.length;
    const hrDelta = avgHrSecond - avgHrFirst;
    if (hrDelta <= -3) hrTrend = 'decreasing';
    else if (hrDelta >= 3) hrTrend = 'increasing';
    else hrTrend = 'stable';
  }

  // Build summary
  const summaryParts: string[] = [];
  if (paceDir === 'improving') {
    summaryParts.push(`Pace membaik ${Math.abs(paceDelta)} detik/km dalam ${weeksWithRuns.length} minggu terakhir`);
  } else if (paceDir === 'declining') {
    summaryParts.push(`Pace melambat ${paceDelta} detik/km — perlu evaluasi intensitas atau pemulihan`);
  } else {
    summaryParts.push('Pace stabil dan konsisten');
  }

  if (volDir === 'increasing') {
    summaryParts.push(`volume latihan naik ${volDelta}%`);
  } else if (volDir === 'decreasing') {
    summaryParts.push(`volume latihan turun ${Math.abs(volDelta)}%`);
  }

  if (rampWarning) {
    summaryParts.push(`⚠️ Kenaikan volume minggu ini ${weeklyRamp}% melebihi batas aman 10%`);
  }

  if (hrTrend === 'decreasing') {
    summaryParts.push('detak jantung rata-rata menurun (indikator fitness meningkat)');
  } else if (hrTrend === 'increasing') {
    summaryParts.push('detak jantung rata-rata naik — kemungkinan kelelahan atau overtraining');
  }

  return {
    weeks: snapshots,
    paceTrendDirection: paceDir,
    paceDeltaSecPerKm: paceDelta,
    volumeTrendDirection: volDir,
    volumeDeltaPercent: volDelta,
    avgHrTrend: hrTrend,
    weeklyVolumeRampPercent: weeklyRamp,
    rampWarning,
    summary: summaryParts.join('; ') + '.',
  };
}

/**
 * DEFAULT TARGETS - digunakan saat tidak ada data historis
 */
const DEFAULT_TARGETS: ProgressiveTargets = {
  tempoPaceRange: "7'15\" - 7'30\"/km",
  tempoPaceSecPerKmLow: 435,
  tempoPaceSecPerKmHigh: 450,
  tempoDistanceKm: 5.0,
  intervalPaceRange: "6'45\" - 7'00\"/km",
  intervalPaceSecPerKmLow: 405,
  intervalPaceSecPerKmHigh: 420,
  longRunPaceRange: "8'15\" - 8'40\"/km",
  longRunPaceSecPerKmLow: 495,
  longRunPaceSecPerKmHigh: 520,
  longRunDistanceKm: 7.0,
  maxHrEstimate: null,
  zone2HrRange: null,
  zone4HrRange: null,
  basedOnWeeks: 0,
  isDefault: true,
};

/**
 * Menghitung target latihan progresif berdasarkan data historis
 *
 * Logika:
 * - Tempo pace = avg pace - 15-30 detik (sedikit di atas comfort zone)
 * - Interval pace = avg pace - 30-45 detik (threshold/VO2Max zone)
 * - Long Run pace = avg pace + 45-60 detik (conversational / Zone 2)
 * - Distance progressive: +5-10% per bulan dari rata-rata volume
 * - HR zones berdasarkan max HR yang tercatat (Karvonen simplified)
 */
export function calculateProgressiveTargets(
  activities: ActivityData[],
  weeksBack: number = 6
): ProgressiveTargets {
  const runActivities = activities.filter((a) => a.type === 'RUN');

  if (runActivities.length < 3) {
    return DEFAULT_TARGETS;
  }

  // Gunakan data N minggu terakhir
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - weeksBack * 7 * 24 * 3600 * 1000);
  const recentRuns = runActivities.filter((a) => new Date(a.startTime) >= cutoffDate);

  if (recentRuns.length < 3) {
    return DEFAULT_TARGETS;
  }

  // Hitung rata-rata pace dari recent runs
  const runsWithPace = recentRuns.filter((a) => a.avgPaceSecPerKm && a.avgPaceSecPerKm > 0);
  if (runsWithPace.length === 0) {
    return DEFAULT_TARGETS;
  }

  const avgPace = runsWithPace.reduce((acc, a) => acc + (a.avgPaceSecPerKm || 0), 0) / runsWithPace.length;

  // Hitung rata-rata jarak
  const runsWithDist = recentRuns.filter((a) => a.distanceMeters && a.distanceMeters > 0);
  const avgDistKm =
    runsWithDist.length > 0
      ? runsWithDist.reduce((acc, a) => acc + ((a.distanceMeters || 0) / 1000), 0) / runsWithDist.length
      : 5.0;

  // Max long run distance dari data historis
  const maxDistKm = runsWithDist.reduce(
    (max, a) => Math.max(max, (a.distanceMeters || 0) / 1000),
    0
  );

  // === PROGRESSIVE PACE TARGETS ===
  // Tempo: 15-30 detik lebih cepat dari rata-rata (challenging but sustainable)
  const tempoPaceLow = Math.round(avgPace - 30); // faster end
  const tempoPaceHigh = Math.round(avgPace - 15); // slower end

  // Interval: 30-45 detik lebih cepat (VO2Max zone)
  const intervalPaceLow = Math.round(avgPace - 45);
  const intervalPaceHigh = Math.round(avgPace - 30);

  // Long Run: 45-60 detik lebih lambat (Zone 2 conversational)
  const longRunPaceLow = Math.round(avgPace + 45);
  const longRunPaceHigh = Math.round(avgPace + 60);

  // === PROGRESSIVE DISTANCE TARGETS ===
  // Tempo distance: rata-rata + 10%, min 4km max 8km
  const tempoDistKm = Math.max(4.0, Math.min(8.0, Number((avgDistKm * 1.1).toFixed(1))));

  // Long run: max historis + 5-10%, min 6km max 21km (half marathon cap)
  const longRunDistKm = Math.max(
    6.0,
    Math.min(21.0, Number((Math.max(maxDistKm, avgDistKm * 1.3) * 1.05).toFixed(1)))
  );

  // === HR ZONES (jika data tersedia) ===
  const runsWithHr = recentRuns.filter((a) => a.maxHeartRate && a.maxHeartRate > 0);
  let maxHrEstimate: number | null = null;
  let zone2HrRange: string | null = null;
  let zone4HrRange: string | null = null;

  if (runsWithHr.length > 0) {
    // Gunakan max HR tertinggi yang tercatat (lebih akurat dari formula 220-age)
    maxHrEstimate = Math.round(
      runsWithHr.reduce((max, a) => Math.max(max, a.maxHeartRate || 0), 0)
    );

    if (maxHrEstimate > 0) {
      // Zone 2 (Aerobic/Endurance): 60-70% max HR
      const z2Low = Math.round(maxHrEstimate * 0.6);
      const z2High = Math.round(maxHrEstimate * 0.7);
      zone2HrRange = `${z2Low}-${z2High} bpm`;

      // Zone 4 (Threshold/Tempo): 80-90% max HR
      const z4Low = Math.round(maxHrEstimate * 0.8);
      const z4High = Math.round(maxHrEstimate * 0.9);
      zone4HrRange = `${z4Low}-${z4High} bpm`;
    }
  }

  return {
    tempoPaceRange: `${formatPace(tempoPaceLow)} - ${formatPace(tempoPaceHigh)}`,
    tempoPaceSecPerKmLow: tempoPaceLow,
    tempoPaceSecPerKmHigh: tempoPaceHigh,
    tempoDistanceKm: tempoDistKm,
    intervalPaceRange: `${formatPace(intervalPaceLow)} - ${formatPace(intervalPaceHigh)}`,
    intervalPaceSecPerKmLow: intervalPaceLow,
    intervalPaceSecPerKmHigh: intervalPaceHigh,
    longRunPaceRange: `${formatPace(longRunPaceLow)} - ${formatPace(longRunPaceHigh)}`,
    longRunPaceSecPerKmLow: longRunPaceLow,
    longRunPaceSecPerKmHigh: longRunPaceHigh,
    longRunDistanceKm: longRunDistKm,
    maxHrEstimate,
    zone2HrRange,
    zone4HrRange,
    basedOnWeeks: weeksBack,
    isDefault: false,
  };
}
