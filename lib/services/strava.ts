import { prisma } from '@/lib/db/prisma';
import { ActivitySource, ActivityType } from '@prisma/client';

export interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete?: {
    id: number;
    username?: string;
    firstname?: string;
    lastname?: string;
  };
}

export interface StravaApiActivity {
  id: number;
  name: string;
  distance: number; // in meters
  moving_time: number; // in seconds
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  sport_type?: string;
  start_date: string;
  map?: {
    id: string;
    summary_polyline?: string;
  };
  calories?: number;
  average_speed?: number; // m/s
}

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID || '';
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET || '';

/**
 * Mendapatkan Access Token Strava yang masih valid.
 * Jika token sudah kedaluwarsa atau tersisa < 5 menit, otomatis memicu refresh token.
 */
export async function getValidStravaToken(userId: string): Promise<string> {
  const tokenRecord = await prisma.stravaToken.findUnique({
    where: { userId },
  });

  if (!tokenRecord) {
    throw new Error('Akun Strava belum terhubung untuk pengguna ini.');
  }

  const nowWithBuffer = new Date(Date.now() + 5 * 60 * 1000); // Buffer 5 menit

  if (tokenRecord.expiresAt > nowWithBuffer) {
    return tokenRecord.accessToken;
  }

  // Token kedaluwarsa -> Refresh token ke Strava API
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: tokenRecord.refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal memperbarui token Strava: ${errorText}`);
  }

  const data: StravaTokenResponse = await response.json();

  const updated = await prisma.stravaToken.update({
    where: { userId },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(data.expires_at * 1000),
    },
  });

  return updated.accessToken;
}

/**
 * Menghitung estimasi pembakaran kalori berdasarkan standar fisiologi olahraga (ACSM/METs)
 * jika data kalori dari Strava tidak disediakan atau bernilai null/0.
 */
export function estimateActivityCalories({
  type,
  distanceMeters,
  durationSec,
  avgSpeedMs,
  weightKg = 68,
}: {
  type: ActivityType;
  distanceMeters?: number | null;
  durationSec: number;
  avgSpeedMs?: number | null;
  weightKg?: number;
}): number {
  const durationHours = Math.max(0.01, durationSec / 3600);
  const distanceKm = distanceMeters && distanceMeters > 0 ? distanceMeters / 1000 : 0;
  const effectiveWeight = weightKg && weightKg >= 35 && weightKg <= 200 ? weightKg : 68;

  switch (type) {
    case ActivityType.RUN: {
      // Formula fisiologi lari standar: ~1.036 kcal per kg per km
      if (distanceKm > 0) {
        return Math.max(1, Math.round(distanceKm * effectiveWeight * 1.036));
      }
      // Jika treadmill / durasi tanpa jarak: estimasi MET 10.0 (~6:00 min/km)
      return Math.max(1, Math.round(durationHours * 10.0 * effectiveWeight));
    }
    case ActivityType.RIDE: {
      // Menentukan MET bersepeda berdasarkan kecepatan rata-rata (km/jam)
      const speedKmh =
        distanceKm > 0 && durationHours > 0
          ? distanceKm / durationHours
          : avgSpeedMs && avgSpeedMs > 0
          ? avgSpeedMs * 3.6
          : 20;

      let met = 7.0; // Moderate cycling (19-22 km/h)
      if (speedKmh >= 26) met = 10.0;
      else if (speedKmh >= 22) met = 8.5;
      else if (speedKmh < 16) met = 4.5;
      else met = 6.8;

      return Math.max(1, Math.round(durationHours * met * effectiveWeight));
    }
    case ActivityType.SWIM: {
      // Renang moderat: ~7.0 METs
      return Math.max(1, Math.round(durationHours * 7.0 * effectiveWeight));
    }
    case ActivityType.WALK:
    case ActivityType.HIKE: {
      if (distanceKm > 0) {
        // Jalan kaki: ~0.73 kcal/kg/km, Hiking: ~0.85 kcal/kg/km
        const factor = type === ActivityType.HIKE ? 0.85 : 0.73;
        return Math.max(1, Math.round(distanceKm * effectiveWeight * factor));
      }
      return Math.max(1, Math.round(durationHours * 3.8 * effectiveWeight));
    }
    case ActivityType.WEIGHT_TRAINING: {
      // Latihan beban terstruktur: ~5.5 METs
      return Math.max(1, Math.round(durationHours * 5.5 * effectiveWeight));
    }
    default: {
      // Aktivitas umum: ~5.0 METs
      return Math.max(1, Math.round(durationHours * 5.0 * effectiveWeight));
    }
  }
}

/**
 * Memetakan tipe aktivitas Strava ke enum ActivityType di database
 */
export function mapStravaActivityType(stravaType: string): ActivityType {
  const normalized = stravaType.toLowerCase();
  if (normalized.includes('run')) return ActivityType.RUN;
  if (normalized.includes('ride') || normalized.includes('cycle')) return ActivityType.RIDE;
  if (normalized.includes('swim')) return ActivityType.SWIM;
  if (normalized.includes('weight') || normalized.includes('workout') || normalized.includes('crossfit')) {
    return ActivityType.WEIGHT_TRAINING;
  }
  if (normalized.includes('walk')) return ActivityType.WALK;
  if (normalized.includes('hike')) return ActivityType.HIKE;
  return ActivityType.OTHER;
}

/**
 * Mengambil daftar aktivitas dari Strava API
 */
export async function fetchAthleteActivities(
  userId: string,
  page = 1,
  perPage = 30
): Promise<StravaApiActivity[]> {
  const accessToken = await getValidStravaToken(userId);

  const res = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal mengambil data aktivitas Strava: ${errorText}`);
  }

  return res.json();
}

/**
 * Memperbarui aktivitas di database yang kalorinya masih null atau 0
 */
export async function backfillMissingCalories(userId?: string): Promise<number> {
  // Ambil berat badan terakhir pengguna
  const weightLog = userId
    ? await prisma.weightLog.findFirst({
        where: { userId },
        orderBy: { loggedAt: 'desc' },
        select: { weightKg: true },
      })
    : null;
  const userWeightKg = weightLog?.weightKg || 68;

  const whereClause = userId
    ? { userId, OR: [{ calories: null }, { calories: 0 }] }
    : { OR: [{ calories: null }, { calories: 0 }] };

  const uncaloriedActivities = await prisma.activity.findMany({
    where: whereClause,
  });

  let updatedCount = 0;
  for (const act of uncaloriedActivities) {
    const estimated = estimateActivityCalories({
      type: act.type,
      distanceMeters: act.distanceMeters,
      durationSec: act.durationSec,
      weightKg: userWeightKg,
    });

    await prisma.activity.update({
      where: { id: act.id },
      data: { calories: estimated },
    });
    updatedCount++;
  }

  return updatedCount;
}

/**
 * Melakukan sinkronisasi aktivitas dari Strava ke database PostgreSQL
 * dengan kalkulasi kalori adaptif berbasis fisiologi olahraga.
 */
export async function syncStravaActivities(userId: string): Promise<{ syncedCount: number; backfilledCount: number }> {
  // Ambil berat badan terakhir pengguna untuk presisi perhitungan kalori
  const latestWeight = await prisma.weightLog.findFirst({
    where: { userId },
    orderBy: { loggedAt: 'desc' },
    select: { weightKg: true },
  });
  const userWeightKg = latestWeight?.weightKg || 68;

  const stravaActivities = await fetchAthleteActivities(userId, 1, 30);
  let count = 0;

  for (const item of stravaActivities) {
    const activityIdBigInt = BigInt(item.id);
    const durationSec = item.moving_time || item.elapsed_time;
    let avgPaceSecPerKm: number | null = null;

    if (item.distance && item.distance > 0 && durationSec > 0) {
      avgPaceSecPerKm = durationSec / (item.distance / 1000);
    }

    const activityType = mapStravaActivityType(item.type);

    // Prioritaskan kalori dari Strava jika ada (> 0). Jika kosong/null, gunakan estimasi fisiologis
    const finalCalories =
      item.calories && item.calories > 0
        ? Math.round(item.calories)
        : estimateActivityCalories({
            type: activityType,
            distanceMeters: item.distance,
            durationSec,
            avgSpeedMs: item.average_speed,
            weightKg: userWeightKg,
          });

    await prisma.activity.upsert({
      where: {
        stravaActivityId: activityIdBigInt,
      },
      update: {
        title: item.name,
        type: activityType,
        startTime: new Date(item.start_date),
        durationSec,
        distanceMeters: item.distance,
        avgPaceSecPerKm,
        elevationGainM: item.total_elevation_gain,
        summaryPolyline: item.map?.summary_polyline || null,
        calories: finalCalories,
      },
      create: {
        userId,
        source: ActivitySource.STRAVA,
        stravaActivityId: activityIdBigInt,
        type: activityType,
        title: item.name,
        startTime: new Date(item.start_date),
        durationSec,
        distanceMeters: item.distance,
        avgPaceSecPerKm,
        elevationGainM: item.total_elevation_gain,
        summaryPolyline: item.map?.summary_polyline || null,
        calories: finalCalories,
      },
    });

    count++;
  }

  // Backfill otomatis setiap record aktivitas lain yang mungkin masih kosong kalorinya
  const backfilledCount = await backfillMissingCalories(userId);

  return { syncedCount: count, backfilledCount };
}
