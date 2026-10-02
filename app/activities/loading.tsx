import React from 'react';
import Skeleton from '@/components/ui/Skeleton';

export default function ActivitiesLoading() {
  return (
    <div className="w-full px-3 sm:px-4 py-4 space-y-4 pb-[calc(7rem+env(safe-area-inset-bottom))] animate-in fade-in duration-150">
      {/* 1. Header & Actions Skeleton */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="space-y-1">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg shrink-0" />
      </div>

      {/* 2. Top Summary Stat Badges in 2x2 Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 space-y-1.5 shadow-2xs"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>

      {/* 3. Filter & Search Toolbar Skeleton */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg shrink-0" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Skeleton className="h-7 w-20 rounded-full shrink-0" />
          <Skeleton className="h-7 w-20 rounded-full shrink-0" />
          <Skeleton className="h-7 w-24 rounded-full shrink-0" />
          <Skeleton className="h-7 w-22 rounded-full shrink-0" />
        </div>
      </div>

      {/* 4. Activity Cards Feed Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Skeleton className="w-9 h-9 rounded-xl shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-36 sm:w-48" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="h-7 w-20 rounded-lg shrink-0" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
              <Skeleton className="h-8 rounded" />
              <Skeleton className="h-8 rounded" />
              <Skeleton className="h-8 rounded" />
              <Skeleton className="h-8 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* 5. Pagination Skeleton */}
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <div className="flex gap-1.5">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}
