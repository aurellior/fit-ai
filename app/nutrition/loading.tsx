import React from 'react';
import Skeleton from '@/components/ui/Skeleton';

export default function NutritionLoading() {
  return (
    <div className="w-full px-3 sm:px-4 py-4 space-y-4 pb-6 animate-in fade-in duration-150">
      {/* 1. Breadcrumbs & Header Skeleton */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <Skeleton className="h-3 w-16" />
          <span className="text-zinc-400 text-xs">/</span>
          <Skeleton className="h-3 w-14" />
        </div>

        <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-24 rounded-lg shrink-0" />
        </div>
      </div>

      {/* 2. 7-Day Nutrition Audit History Skeleton */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
        <div className="grid grid-cols-7 gap-1.5 pt-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>

      {/* 3. 4 Macronutrient Cards Grid in 2x2 Mobile Layout Skeleton */}
      <div className="grid grid-cols-2 gap-2.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-3 sm:p-4 bg-white dark:bg-[#121214] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs space-y-1.5"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>

      {/* 4. Search Bar Skeleton */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-xs">
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>

      {/* 5. Food Logs List Container Skeleton */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-24" />
              </div>

              <div className="flex items-center gap-4">
                <div className="space-y-1 text-right">
                  <Skeleton className="h-4 w-18 ml-auto" />
                  <Skeleton className="h-3 w-28 ml-auto" />
                </div>
                <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <div className="flex gap-1.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
