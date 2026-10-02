import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getActivityById } from '@/actions/activity';
import {
  formatDuration,
  formatDistance,
  formatPace,
  formatDate,
} from '@/lib/utils';
import {
  Activity,
  Dumbbell,
  Bike,
  Footprints,
  Clock,
  Flame,
  Gauge,
  Mountain,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { ActivitySource, ActivityType } from '@prisma/client';
import DeleteActivityButton from '@/components/activities/DeleteActivityButton';

export const dynamic = 'force-dynamic';

interface ActivityDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ActivityDetailPage({ params }: ActivityDetailPageProps) {
  const { id } = await params;
  const activity = await getActivityById(id);

  if (!activity) {
    notFound();
  }

  const isStrava = activity.source === ActivitySource.STRAVA;
  const isGym = activity.type === ActivityType.WEIGHT_TRAINING;
  const sets = Array.isArray(activity.gymSets) ? activity.gymSets : null;

  // Calculate total gym volume (Sets * Reps * Weight)
  const totalVolumeKg = sets
    ? sets.reduce((sum, s) => sum + s.sets * s.reps * (s.weightKg || 0), 0)
    : 0;

  // Estimated speed in km/h for cardio
  const speedKmh =
    activity.distanceMeters && activity.durationSec
      ? ((activity.distanceMeters / 1000) / (activity.durationSec / 3600)).toFixed(1)
      : null;

  const getSportIcon = (type: string) => {
    switch (type) {
      case 'WEIGHT_TRAINING':
        return <Dumbbell className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'RIDE':
        return <Bike className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'WALK':
      case 'HIKE':
        return <Footprints className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      default:
        return <Activity className="w-5 h-5 text-[#FC5200]" />;
    }
  };

  return (
    <div className="w-full px-3 sm:px-4 py-4 space-y-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {/* 1. Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
        <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/activities" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
          Aktivitas
        </Link>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-100 font-semibold truncate max-w-[130px]">
          {activity.title}
        </span>
      </div>

      {/* 2. Top Header & Action Controls */}
      <div className="pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0 mt-0.5 shadow-xs">
              {getSportIcon(activity.type)}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                {activity.title}
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                    isStrava
                      ? 'bg-[#FC5200]/10 text-[#FC5200] border border-[#FC5200]/20'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {activity.source}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  {activity.type.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {formatDate(activity.startTime)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isStrava && activity.stravaActivityId && (
              <a
                href={`https://www.strava.com/activities/${activity.stravaActivityId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-[#FC5200] hover:bg-[#E04900] text-white transition-colors flex items-center gap-1 shadow-xs"
              >
                <span>Strava</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {!isStrava && (
              <DeleteActivityButton activityId={activity.id} />
            )}
          </div>
        </div>
      </div>

      {/* 3. Primary Metrics Big KPI Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3">
          <div className="flex items-center gap-1 text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">
            <Clock className="w-3 h-3" />
            <span>Durasi</span>
          </div>
          <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
            {formatDuration(activity.durationSec)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3">
          <div className="flex items-center gap-1 text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">
            <Gauge className="w-3 h-3" />
            <span>{isGym ? 'Volume' : 'Jarak'}</span>
          </div>
          <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
            {isGym ? (
              <>
                {totalVolumeKg.toLocaleString()}{' '}
                <span className="text-xs font-normal text-zinc-500 font-sans">kg</span>
              </>
            ) : (
              formatDistance(activity.distanceMeters)
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3">
          <div className="flex items-center gap-1 text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">
            <Flame className="w-3 h-3 text-[#FC5200]" />
            <span>Kalori</span>
          </div>
          <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
            {activity.calories ? activity.calories.toLocaleString() : '-'}{' '}
            <span className="text-xs font-normal text-zinc-500 font-sans">kkal</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3">
          <div className="flex items-center gap-1 text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">
            <Mountain className="w-3 h-3" />
            <span>{isGym ? 'Gerakan' : activity.avgPaceSecPerKm ? 'Avg Pace' : 'Elevasi'}</span>
          </div>
          <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
            {isGym ? (
              <>
                {sets?.length || 0}{' '}
                <span className="text-xs font-normal text-zinc-500 font-sans">gerakan</span>
              </>
            ) : activity.avgPaceSecPerKm ? (
              formatPace(activity.avgPaceSecPerKm)
            ) : activity.elevationGainM ? (
              `+${activity.elevationGainM}m`
            ) : (
              '-'
            )}
          </div>
        </div>
      </div>

      {/* 4. Cardio Metrics Breakdown */}
      {!isGym && (speedKmh || activity.elevationGainM) && (
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2 font-mono">
            Metrik Lanjutan Kardio
          </h3>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            {speedKmh && (
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Kecepatan</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {speedKmh} <span className="text-[10px] font-normal text-zinc-500">km/j</span>
                </span>
              </div>
            )}
            {activity.elevationGainM !== undefined && activity.elevationGainM !== null && (
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Elevasi</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  +{activity.elevationGainM}m
                </span>
              </div>
            )}
            <div>
              <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Burn Rate</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {activity.calories && activity.durationSec
                  ? (activity.calories / (activity.durationSec / 60)).toFixed(1) + ' kkal/m'
                  : '-'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Gym Set-by-Set Breakdown */}
      {isGym && sets && sets.length > 0 && (
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase font-mono tracking-wider">
              Rincian Gerakan ({sets.length})
            </h3>
            <span className="text-[11px] font-mono text-[#FC5200] font-bold">
              {totalVolumeKg.toLocaleString()} kg total
            </span>
          </div>

          <div className="space-y-1.5">
            {sets.map((set, idx) => {
              const setVol = set.sets * set.reps * (set.weightKg || 0);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 text-xs font-mono"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500 font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate font-sans">
                      {set.exercise}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">
                      {set.sets}x{set.reps} @ {set.weightKg}kg
                    </div>
                    <div className="text-[10px] text-[#FC5200] font-medium">
                      {setVol > 0 ? `${setVol.toLocaleString()} kg` : 'Bodyweight'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Athlete Workout Notes */}
      {activity.notes && (
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 font-mono">
            Catatan Sesi
          </h3>
          <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {activity.notes}
          </p>
        </div>
      )}

      {/* 7. AI Performance Recovery Directive */}
      <div className="bg-[#FC5200]/5 dark:bg-[#FC5200]/10 border border-[#FC5200]/25 rounded-xl p-3.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#FC5200]" />
          <h3 className="text-[10px] font-bold text-[#FC5200] uppercase tracking-wider font-mono">
            AI Directive
          </h3>
        </div>
        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-snug">
          {isGym
            ? `Beban kerja ${totalVolumeKg > 0 ? `${totalVolumeKg.toLocaleString()} kg` : 'sesi ini'} butuh pemulihan ~48 jam. Targetkan 25-35g protein segera untuk hipertrofi.`
            : `Sesi ${formatDuration(activity.durationSec)} stabil di zona aerobik. Pertahankan hidrasi dan lakukan peregangan dinamis.`}
        </p>
      </div>
    </div>
  );
}
