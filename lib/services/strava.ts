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
 * Melakukan sinkronisasi aktivitas dari Strava ke database PostgreSQL
 */
export async function syncStravaActivities(userId: string): Promise<{ syncedCount: number }> {
  const stravaActivities = await fetchAthleteActivities(userId, 1, 30);
  let count = 0;

  for (const item of stravaActivities) {
    const activityIdBigInt = BigInt(item.id);
    const durationSec = item.moving_time || item.elapsed_time;
    let avgPaceSecPerKm: number | null = null;

    if (item.distance && item.distance > 0 && durationSec > 0) {
      avgPaceSecPerKm = durationSec / (item.distance / 1000);
    }

    await prisma.activity.upsert({
      where: {
        stravaActivityId: activityIdBigInt,
      },
      update: {
        title: item.name,
        type: mapStravaActivityType(item.type),
        startTime: new Date(item.start_date),
        durationSec,
        distanceMeters: item.distance,
        avgPaceSecPerKm,
        elevationGainM: item.total_elevation_gain,
        summaryPolyline: item.map?.summary_polyline || null,
        calories: item.calories ? Math.round(item.calories) : null,
      },
      create: {
        userId,
        source: ActivitySource.STRAVA,
        stravaActivityId: activityIdBigInt,
        type: mapStravaActivityType(item.type),
        title: item.name,
        startTime: new Date(item.start_date),
        durationSec,
        distanceMeters: item.distance,
        avgPaceSecPerKm,
        elevationGainM: item.total_elevation_gain,
        summaryPolyline: item.map?.summary_polyline || null,
        calories: item.calories ? Math.round(item.calories) : null,
      },
    });

    count++;
  }

  return { syncedCount: count };
}
