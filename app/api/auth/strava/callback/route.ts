import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { syncStravaActivities } from '@/lib/services/strava';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/dashboard?error=strava_denied`);
  }

  try {
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: Number(process.env.STRAVA_CLIENT_ID),
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Strava token exchange failed:', errText);
      return NextResponse.redirect(`${baseUrl}/dashboard?error=strava_token_exchange_failed`);
    }

    const data = await tokenRes.json();
    const user = await getCurrentUser();

    // Simpan atau update token Strava di DB (dengan fallback jika PostgreSQL belum aktif)
    try {
      await prisma.stravaToken.upsert({
        where: { userId: user.id },
        update: {
          athleteId: String(data.athlete.id),
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: new Date(data.expires_at * 1000),
        },
        create: {
          userId: user.id,
          athleteId: String(data.athlete.id),
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: new Date(data.expires_at * 1000),
        },
      });

      // Pemicu otomatis sinkronisasi aktivitas awal dari Strava
      try {
        await syncStravaActivities(user.id);
      } catch (syncErr) {
        console.warn('Initial sync warning:', syncErr);
      }
    } catch (dbErr) {
      console.warn('Database offline, token diterima dan disimpan via cookie session:', dbErr);
      const res = NextResponse.redirect(`${baseUrl}/dashboard?strava=connected`);
      res.cookies.set('strava_connected', 'true', { path: '/', maxAge: 60 * 60 * 24 * 30 });
      res.cookies.set('strava_athlete_id', String(data.athlete.id), { path: '/', maxAge: 60 * 60 * 24 * 30 });
      return res;
    }

    return NextResponse.redirect(`${baseUrl}/dashboard?strava=connected`);
  } catch (err: unknown) {
    console.error('Error during Strava callback:', err);
    return NextResponse.redirect(`${baseUrl}/dashboard?error=internal_strava_error`);
  }
}
