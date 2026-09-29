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
  ArrowLeft,
  Activity,
  Dumbbell,
  Bike,
  Footprints,
  Calendar,
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-20">
      {/* 1. Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/activities" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
          Aktivitas
        </Link>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-100 font-semibold truncate max-w-[200px]">
          {activity.title}
        </span>
      </div>

      {/* 2. Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0 mt-0.5 shadow-xs">
            {getSportIcon(activity.type)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {activity.title}
              </h1>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold ${
                  isStrava
                    ? 'bg-orange-50 text-[#FC5200] dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {activity.source}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                {activity.type.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1.5 font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                {formatDate(activity.startTime)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/activities"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5 bg-white dark:bg-[#121214] shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </Link>

          {isStrava && activity.stravaActivityId && (
            <a
              href={`https://www.strava.com/activities/${activity.stravaActivityId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-[#FC5200] hover:bg-[#E04900] text-white transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Strava Web</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {!isStrava && (
            <DeleteActivityButton activityId={activity.id} />
          )}
        </div>
      </div>

      {/* 3. Primary Metrics Big KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Durasi</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
            {formatDuration(activity.durationSec)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1 font-mono">
            <Gauge className="w-3.5 h-3.5" />
            <span>{isGym ? 'Total Volume' : 'Jarak'}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
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

        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1 font-mono">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Kalori</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
            {activity.calories ? activity.calories.toLocaleString() : '-'}{' '}
            <span className="text-xs font-normal text-zinc-500 font-sans">kkal</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1 font-mono">
            <Mountain className="w-3.5 h-3.5" />
            <span>{isGym ? 'Total Gerakan' : activity.avgPaceSecPerKm ? 'Avg Pace' : 'Elevasi'}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
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
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 font-mono">
            Analisis Metrik Kardio
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
            {speedKmh && (
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Kecepatan Rata-rata</span>
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {speedKmh} km/jam
                </span>
              </div>
            )}
            {activity.elevationGainM !== undefined && activity.elevationGainM !== null && (
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Elevasi Positif</span>
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  +{activity.elevationGainM} meter
                </span>
              </div>
            )}
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Efisiensi Kalori/Menit</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {activity.calories && activity.durationSec
                  ? (activity.calories / (activity.durationSec / 60)).toFixed(1) + ' kkal/m'
                  : '-'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Gym Set-by-Set Breakdown Table */}
      {isGym && sets && sets.length > 0 && (
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Tabel Rincian Latihan Beban
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Set, repetisi, beban per latihan, dan akumulasi volume kerja
              </p>
            </div>
            <div className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-lg text-zinc-700 dark:text-zinc-300 font-semibold">
              Volume: {totalVolumeKg.toLocaleString()} kg
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[500px]">
              <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-400 uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Nama Gerakan</th>
                  <th className="px-4 py-3 text-center font-semibold">Set</th>
                  <th className="px-4 py-3 text-center font-semibold">Repetisi</th>
                  <th className="px-4 py-3 text-center font-semibold">Beban (Kg)</th>
                  <th className="px-4 py-3 text-right font-semibold">Volume (Kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono">
                {sets.map((set, idx) => {
                  const setVol = set.sets * set.reps * (set.weightKg || 0);
                  return (
                    <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 text-zinc-400 font-sans">{idx + 1}</td>
                      <td className="px-4 py-3 font-sans font-semibold text-zinc-900 dark:text-zinc-100">
                        {set.exercise}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{set.sets} set</td>
                      <td className="px-4 py-3 text-center font-medium">{set.reps} reps</td>
                      <td className="px-4 py-3 text-center font-bold text-zinc-900 dark:text-zinc-100">
                        {set.weightKg} kg
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#FC5200]">
                        {setVol > 0 ? `${setVol.toLocaleString()} kg` : 'Bodyweight'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Athlete Workout Notes */}
      {activity.notes && (
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 font-mono">
            Catatan Sesi Latihan
          </h3>
          <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {activity.notes}
          </p>
        </div>
      )}

      {/* 7. AI Performance Recovery Tip */}
      <div className="bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#FC5200]" />
          <h3 className="text-xs font-bold text-orange-900 dark:text-orange-200 uppercase tracking-wider font-mono">
            AI Performance & Recovery Advice
          </h3>
        </div>
        <p className="text-xs text-orange-950/80 dark:text-orange-200/80 leading-relaxed">
          {isGym
            ? `Beban kerja latihan beban sebesar ${totalVolumeKg > 0 ? `${totalVolumeKg.toLocaleString()} kg` : 'sesi intensif'} memerlukan regenerasi serat otot minimum 48 jam. Pastikan asupan protein 25-35g pasca sesi untuk memicu sintesis protein otot.`
            : `Sesi ${activity.type.toLowerCase()} dengan durasi ${formatDuration(activity.durationSec)} menjaga kapasitas kardiovaskular stabil di zona aerobik. Lakukan peregangan dinamis dan hidrasi cukup.`}
        </p>
      </div>
    </div>
  );
}
