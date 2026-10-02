import React from 'react';
import Skeleton from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="w-full px-3 sm:px-4 py-4">
      <div className="space-y-4 sm:space-y-5 pb-[calc(6rem+env(safe-area-inset-bottom))] animate-in fade-in duration-150">
        {/* 1. Top Sub-header Bar: Strava Sync & Status Skeleton */}
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FC5200] animate-pulse shrink-0" />
            <Skeleton className="h-3.5 w-36" />
          </div>
          <Skeleton className="h-8 w-28 rounded-lg shrink-0" />
        </div>

        {/* 2. Top Overview Hero Card: Today's AI Coach Directive Skeleton */}
        <div className="rounded-3xl bg-zinc-900/90 dark:bg-[#111116] border border-zinc-800/90 p-4 sm:p-5 space-y-4 shadow-xl">
          {/* Greeting Row */}
          <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-10 h-10 rounded-2xl bg-zinc-800" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-20 bg-zinc-800" />
                <Skeleton className="h-4 w-36 bg-zinc-800" />
              </div>
            </div>
            <Skeleton className="h-6 w-28 rounded-full bg-zinc-800" />
          </div>

          {/* Today Directive & Target */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-36 bg-zinc-800" />
              <Skeleton className="h-5 w-24 rounded-full bg-zinc-800" />
            </div>
            <Skeleton className="h-6 w-52 bg-zinc-800" />
            <Skeleton className="h-6 w-32 rounded-lg bg-zinc-800" />
            <Skeleton className="h-11 w-full rounded-xl bg-zinc-800/60" />
          </div>

          {/* Action Buttons Row */}
          <div className="pt-1 flex items-center gap-2">
            <Skeleton className="h-11 flex-1 rounded-xl bg-orange-600/30" />
            <Skeleton className="h-11 w-24 rounded-xl bg-zinc-800" />
          </div>
        </div>

        {/* 3. Top Stats Bar: Clean Strava Dual-Hierarchy Skeleton */}
        <section className="space-y-3.5">
          {/* Tier Header & Tab Segmen Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FC5200] shrink-0" />
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
            <Skeleton className="h-9 w-full sm:w-48 rounded-lg" />
          </div>

          {/* Weekly Target Progress Banner */}
          <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              <Skeleton className="h-7 w-20" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          </div>

          {/* 4 Weekly KPI Cards in 2x2 Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 sm:p-3.5 space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="w-3.5 h-3.5 rounded" />
                </div>
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>

          {/* All-Time Companion Strip */}
          <div className="bg-zinc-50/80 dark:bg-[#151518] border border-zinc-200/70 dark:border-zinc-800/70 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-7 h-7 rounded-md shrink-0" />
              <Skeleton className="h-3.5 w-48" />
            </div>
            <Skeleton className="h-4 w-24 shrink-0" />
          </div>
        </section>

        {/* 4. Charts Skeleton */}
        <section className="space-y-4">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-28 rounded-md" />
            </div>
            <Skeleton className="h-56 w-full rounded-lg" />
          </div>

          <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-56 w-full rounded-lg" />
          </div>
        </section>

        {/* 5. Weekly AI Insight Skeleton */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>

        {/* 6. Step Check-In Card Skeleton */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="flex items-end justify-between pt-1">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>

        {/* 7. Daily Nutrition Audit Card Skeleton */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="space-y-1">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
