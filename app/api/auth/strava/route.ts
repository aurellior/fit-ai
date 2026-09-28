import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/auth/strava/callback`;
  const scope = 'read,activity:read_all';

  if (!clientId || clientId === 'your_strava_client_id' || clientId === 'mock_strava_client_id') {
    return NextResponse.json(
      {
        error: 'STRAVA_CLIENT_ID belum dikonfigurasi di file .env',
        hint: 'Dapatkan Client ID dari https://www.strava.com/settings/api',
      },
      { status: 400 }
    );
  }

  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&approval_prompt=auto&scope=${scope}`;

  return NextResponse.redirect(stravaAuthUrl);
}
