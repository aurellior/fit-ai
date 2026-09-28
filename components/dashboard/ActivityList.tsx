'use client';

import React from 'react';
import { formatDuration, formatDistance, formatPace, formatDate } from '@/lib/utils';
import { ActivityType, ActivitySource } from '@prisma/client';
import {
  Activity as RunIcon,
  Bike,
  Waves,
  Dumbbell,
  Footprints,
  Calendar,
  Flame,
  Trash2,
} from 'lucide-react';
import { deleteActivity } from '@/actions/activity';
import { ActivityData, GymSet } from '@/types';

interface ActivityListProps {
  activities: ActivityData[];
  onActivityDeleted?: () => void;
}

export default function ActivityList({ activities, onActivityDeleted }: ActivityListProps) {
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.RUN:
        return <RunIcon className="w-5 h-5 text-emerald-600" />;
      case ActivityType.RIDE:
        return <Bike className="w-5 h-5 text-orange-600" />;
      case ActivityType.SWIM:
        return <Waves className="w-5 h-5 text-sky-600" />;
      case ActivityType.WEIGHT_TRAINING:
        return <Dumbbell className="w-5 h-5 text-indigo-600" />;
      case ActivityType.WALK:
      case ActivityType.HIKE:
        return <Footprints className="w-5 h-5 text-amber-600" />;
      default:
        return <RunIcon className="w-5 h-5 text-slate-600" />;
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus aktivitas ini?')) {
      await deleteActivity(id);
      if (onActivityDeleted) onActivityDeleted();
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
        <p className="text-slate-500 text-sm">Belum ada riwayat aktivitas tercatat.</p>
        <p className="text-xs text-slate-400 mt-1">
          Sinkronkan akun Strava atau input sesi latihan manual di atas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((item) => {
        const isStrava = item.source === ActivitySource.STRAVA;
        const sets: GymSet[] | null = Array.isArray(item.gymSets) ? item.gymSets : null;

        return (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-5 shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  {getActivityIcon(item.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      {item.title}
                    </h4>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        isStrava
                          ? 'bg-[#FC4C02]/10 text-[#FC4C02] dark:bg-[#FC4C02]/20'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                      }`}
                    >
                      {item.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(item.startTime)}</span>
                  </div>
                </div>
              </div>

              {!isStrava && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Hapus aktivitas manual"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Metrik Statistik */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-400 block">Durasi</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {formatDuration(item.durationSec)}
                </span>
              </div>

              {item.distanceMeters !== undefined && item.distanceMeters !== null && (
                <div>
                  <span className="text-slate-400 block">Jarak</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {formatDistance(item.distanceMeters)}
                  </span>
                </div>
              )}

              {item.avgPaceSecPerKm && (
                <div>
                  <span className="text-slate-400 block">Pace</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {formatPace(item.avgPaceSecPerKm)}
                  </span>
                </div>
              )}

              {item.calories && (
                <div>
                  <span className="text-slate-400 block flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-500" /> Kalori
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                    {item.calories} kkal
                  </span>
                </div>
              )}
            </div>

            {/* Catatan Gym Detail */}
            {sets && sets.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Daftar Gerakan Beban
                </span>
                <div className="flex flex-wrap gap-2">
                  {sets.map((set, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg"
                    >
                      <strong>{set.exercise}</strong>: {set.sets}x{set.reps} @ {set.weightKg}kg
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.notes && (
              <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                &ldquo;{item.notes}&rdquo;
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
