'use client';

import React from 'react';
import { formatDuration, formatDistance, formatPace, formatDate } from '@/lib/utils';
import { ActivitySource } from '@prisma/client';
import { Trash2 } from 'lucide-react';
import { deleteActivity } from '@/actions/activity';
import { ActivityData, GymSet } from '@/types';

interface ActivityListProps {
  activities: ActivityData[];
  onActivityDeleted?: () => void;
}

export default function ActivityList({ activities, onActivityDeleted }: ActivityListProps) {
  const handleDelete = async (id: string) => {
    if (confirm('Hapus log aktivitas ini?')) {
      await deleteActivity(id);
      if (onActivityDeleted) onActivityDeleted();
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center">
        <p className="text-zinc-500 text-xs">Belum ada riwayat aktivitas yang tercatat.</p>
        <p className="text-zinc-400 text-[11px] mt-1">
          Hubungkan akun Strava atau simpan aktivitas manual untuk melihat log di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {activities.map((item) => {
        const isStrava = item.source === ActivitySource.STRAVA;
        const sets: GymSet[] | null = Array.isArray(item.gymSets) ? item.gymSets : null;

        return (
          <div
            key={item.id}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
          >
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                    {item.title}
                  </h4>
                  <span
                    className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      isStrava
                        ? 'bg-orange-50 text-[#FC5200] dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {item.source}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  {formatDate(item.startTime)} • {item.type}
                </div>
              </div>

              {!isStrava && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-zinc-400 hover:text-rose-600 p-1 rounded transition-colors"
                  title="Hapus aktivitas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Metrics Row */}
            <div className="flex flex-wrap items-center gap-6 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
              <div>
                <span className="text-[10px] uppercase text-zinc-500 block">Durasi</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums font-mono">
                  {formatDuration(item.durationSec)}
                </span>
              </div>

              {item.distanceMeters !== undefined && item.distanceMeters !== null && (
                <div>
                  <span className="text-[10px] uppercase text-zinc-500 block">Jarak</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums font-mono">
                    {formatDistance(item.distanceMeters)}
                  </span>
                </div>
              )}

              {item.avgPaceSecPerKm && (
                <div>
                  <span className="text-[10px] uppercase text-zinc-500 block">Pace</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums font-mono">
                    {formatPace(item.avgPaceSecPerKm)}
                  </span>
                </div>
              )}

              {item.calories && (
                <div>
                  <span className="text-[10px] uppercase text-zinc-500 block">Kalori</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums font-mono">
                    {item.calories} <span className="text-[10px] font-normal text-zinc-500">kkal</span>
                  </span>
                </div>
              )}
            </div>

            {/* Gym Details */}
            {sets && sets.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/60">
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block mb-1.5">
                  Set Latihan Beban
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sets.map((set, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-[11px] bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 font-mono"
                    >
                      {set.exercise}: {set.sets}x{set.reps} @ {set.weightKg}kg
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.notes && (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30 px-2.5 py-1.5 rounded">
                {item.notes}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
