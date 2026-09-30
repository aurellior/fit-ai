import React from 'react';
import Skeleton from '@/components/ui/Skeleton';

export default function NutritionLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-24 md:pb-12 animate-in fade-in duration-150">
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

      {/* 2. Daily Nutrition Audit Card Skeleton */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="h-3.5 w-36" />
            </div>
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>

        {/* Calorie Bar Skeleton */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
        </div>

        {/* 3 Macros Split Grid Skeleton */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 space-y-1.5 text-center"
            >
              <Skeleton className="h-3 w-16 mx-auto" />
              <Skeleton className="h-5 w-12 mx-auto" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. 7-Day Nutrition Audit History Skeleton */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>

      {/* 4. Search Filter Bar Skeleton */}
      <div className="p-3 bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-xs">
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>

      {/* 5. Food Log Items List Skeleton */}
      <div className="space-y-2.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-40 sm:w-52" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/60">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-6 w-24 rounded-md" />
              </div>
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* 6. Pagination Skeleton */}
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
