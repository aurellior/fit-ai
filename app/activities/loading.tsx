import React from 'react';
import Skeleton from '@/components/ui/Skeleton';

export default function ActivitiesLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-24 md:pb-12 animate-in fade-in duration-150">
      {/* 1. Breadcrumbs & Header Skeleton */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-3 w-16" />
          <span className="text-zinc-400">/</span>
          <Skeleton className="h-3 w-16" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="space-y-1.5">
            <Skeleton className="h-7 sm:h-8 w-56 sm:w-72" />
            <Skeleton className="h-3.5 w-64 sm:w-96" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </div>
      </div>

      {/* 2. Top Summary Stat Badges Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="w-5 h-5 rounded-md" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>

      {/* 3. Search & Filter Bar Skeleton */}
      <div className="space-y-3 p-3.5 bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-xs">
        <Skeleton className="h-9 w-full rounded-lg" />
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-24 rounded-md" />
          <Skeleton className="h-7 w-24 rounded-md" />
        </div>
      </div>

      {/* 4. Activity List Cards Skeleton */}
      <div className="space-y-2.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0 mt-0.5" />
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-40 sm:w-56" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/60">
              <div className="space-y-1 text-left sm:text-right">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* 5. Pagination Skeleton */}
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <div className="flex gap-1.5">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}
