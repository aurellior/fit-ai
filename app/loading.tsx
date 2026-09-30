import React from 'react';
import Skeleton from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 sm:space-y-8 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-12 animate-in fade-in duration-150">
      {/* 1. Athlete Hero Header Skeleton */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FC5200] shrink-0"></span>
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-7 sm:h-8 w-56 sm:w-72" />
          <Skeleton className="h-4 w-48 sm:w-64" />
        </div>

        {/* Strava Connect Button Skeleton */}
        <Skeleton className="h-9 w-32 rounded-lg shrink-0" />
      </div>

      {/* 2. Top Stats Bar & Segment Switcher Skeleton */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FC5200] shrink-0"></span>
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-5 w-24 rounded-md" />
          </div>

          {/* Segmented Switcher Skeleton */}
          <Skeleton className="h-9 w-full sm:w-56 rounded-lg" />
        </div>

        {/* Weekly Target Progress Banner Skeleton */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
        </div>

        {/* 4 Stat Cards Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="w-7 h-7 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. AI Coach Insight Banner Skeleton */}
      <div className="bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 border border-[#FC5200]/20 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>
        <div className="space-y-2 pt-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
          <Skeleton className="h-3.5 w-4/6" />
        </div>
      </div>

      {/* 4. Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>

      {/* 5. Activities & Nutrition List Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Activities */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3.5 w-16" />
          </div>
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="space-y-1.5 text-right">
                  <Skeleton className="h-4 w-16 ml-auto" />
                  <Skeleton className="h-3 w-12 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Nutrition Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3.5 w-16" />
          </div>
          <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
