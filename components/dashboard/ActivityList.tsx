'use client';

import React from 'react';
import Link from 'next/link';
import { formatDuration, formatDistance, formatPace, formatDate } from '@/lib/utils';
import { ActivitySource } from '@prisma/client';
import { Trash2, ArrowUpRight, Dumbbell, Activity, Bike, Footprints, ChevronRight } from 'lucide-react';
import { deleteActivity } from '@/actions/activity';
import { ActivityData, GymSet } from '@/types';

interface ActivityListProps {
  activities: ActivityData[];
  onActivityDeleted?: () => void;
  isOverview?: boolean;
}

export default function ActivityList({
  activities,
  onActivityDeleted,
  isOverview = false,
}: ActivityListProps) {
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('Hapus log aktivitas ini?')) {
      await deleteActivity(id);
      if (onActivityDeleted) onActivityDeleted();
    }
  };

  const displayActivities = isOverview ? activities.slice(0, 4) : activities;

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white dark:bg-[#121214] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center">
        <Activity className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
        <p className="text-zinc-800 dark:text-zinc-200 text-xs font-semibold">
          Belum ada riwayat aktivitas yang tercatat
        </p>
        <p className="text-zinc-400 text-[11px] mt-0.5">
          Tarik data dari Strava atau catat latihan manual untuk memulai pelacakan.
        </p>
      </div>
    );
  }

  const getSportIcon = (type: string) => {
    switch (type) {
      case 'WEIGHT_TRAINING':
        return <Dumbbell className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'RIDE':
        return <Bike className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'WALK':
      case 'HIKE':
        return <Footprints className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Activity className="w-4 h-4 text-[#FC5200]" />;
    }
  };

  return (
    <div className="space-y-2.5">
      {displayActivities.map((item) => {
        const isStrava = item.source === ActivitySource.STRAVA;
        const sets: GymSet[] | null = Array.isArray(item.gymSets) ? item.gymSets : null;

        return (
          <div
            key={item.id}
            className="group relative bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 sm:p-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs"
          >
            <div className="flex items-start justify-between gap-2.5 mb-2.5 min-w-0">
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 mt-0.5 shrink-0">
                  {getSportIcon(item.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      href={`/activities/${item.id}`}
                      className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 hover:text-[#FC5200] dark:hover:text-[#FC5200] transition-colors flex items-center gap-1 min-w-0"
                    >
                      <span className="truncate">{item.title}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </Link>
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-medium shrink-0 ${
                        isStrava
                          ? 'bg-orange-50 text-[#FC5200] dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200/80 dark:border-orange-900/50'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {item.source}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5 truncate">
                    {formatDate(item.startTime)} • {item.type.replace('_', ' ')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  href={`/activities/${item.id}`}
                  className="text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 px-2.5 py-1 rounded-md bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-0.5"
                >
                  <span>Detail</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
                {!isStrava && (
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="text-zinc-400 hover:text-rose-600 p-1 rounded transition-colors"
                    title="Hapus aktivitas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Athletic Metrics Row */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-400 block">Durasi</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 tabular-nums font-mono text-xs sm:text-sm">
                  {formatDuration(item.durationSec)}
                </span>
              </div>

              {item.distanceMeters !== undefined && item.distanceMeters !== null && (
                <div>
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">Jarak</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 tabular-nums font-mono text-xs sm:text-sm">
                    {formatDistance(item.distanceMeters)}
                  </span>
                </div>
              )}

              {item.avgPaceSecPerKm && (
                <div>
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">Pace</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 tabular-nums font-mono text-xs sm:text-sm">
                    {formatPace(item.avgPaceSecPerKm)}
                  </span>
                </div>
              )}

              {item.calories && (
                <div>
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">Kalori</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 tabular-nums font-mono text-xs sm:text-sm">
                    {item.calories} <span className="text-[10px] font-normal text-zinc-500">kkal</span>
                  </span>
                </div>
              )}
            </div>

            {/* Gym Set Tags Preview */}
            {sets && sets.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                  Set Latihan Beban {isOverview && sets.length > 2 ? `(${sets.length} gerakan)` : ''}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(isOverview ? sets.slice(0, 2) : sets).map((set, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-[11px] bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded border border-zinc-200/80 dark:border-zinc-800 font-mono"
                    >
                      {set.exercise}: {set.sets}x{set.reps} @ {set.weightKg}kg
                    </span>
                  ))}
                  {isOverview && sets.length > 2 && (
                    <Link
                      href={`/activities/${item.id}`}
                      className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 px-1 py-0.5"
                    >
                      +{sets.length - 2} lainnya
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Notes preview if not in overview */}
            {!isOverview && item.notes && (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30 px-2.5 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                {item.notes}
              </p>
            )}
          </div>
        );
      })}

      {/* Overview Footer Link */}
      {isOverview && (
        <div className="pt-2">
          <Link
            href="/activities"
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121214] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors group shadow-xs"
          >
            <span>Lihat Semua Aktivitas ({activities.length}) & Pagination</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#FC5200]" />
          </Link>
        </div>
      )}
    </div>
  );
}
