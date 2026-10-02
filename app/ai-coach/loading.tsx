import React from 'react';
import Skeleton from '@/components/ui/Skeleton';

export default function AiCoachLoading() {
  return (
    <div className="w-full px-3 sm:px-4 py-4 space-y-4 pb-6 animate-in fade-in duration-150">
      {/* 1. Top Header & Breadcrumb Skeleton */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="space-y-1">
          <Skeleton className="h-3 w-28" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-24 rounded" />
          </div>
        </div>
        <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
      </div>

      {/* 2. Top Overview Hero Card: Today's AI Coach Directive Skeleton */}
      <div className="rounded-3xl bg-zinc-900/90 dark:bg-[#111116] border border-zinc-800/90 p-4 sm:p-5 space-y-4 shadow-xl">
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

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-36 bg-zinc-800" />
            <Skeleton className="h-5 w-24 rounded-full bg-zinc-800" />
          </div>
          <Skeleton className="h-6 w-52 bg-zinc-800" />
          <Skeleton className="h-6 w-32 rounded-lg bg-zinc-800" />
          <Skeleton className="h-11 w-full rounded-xl bg-zinc-800/60" />
        </div>

        <div className="pt-1 flex items-center gap-2">
          <Skeleton className="h-11 flex-1 rounded-xl bg-orange-600/30" />
          <Skeleton className="h-11 w-24 rounded-xl bg-zinc-800" />
        </div>
      </div>

      {/* 3. Section 1: Audit Jadwal & Kedisiplinan Skeleton */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FC5200]" />
            <Skeleton className="h-3.5 w-36" />
          </div>
          <Skeleton className="h-6 w-28 rounded-md" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-3 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-14" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-12 rounded" />
                </div>
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>
        </div>

        <Skeleton className="h-14 w-full rounded-xl" />
      </div>

      {/* 4. Section 2: Program Lari Mingguan Adaptif Skeleton (3 vertical cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FC5200]" />
            <Skeleton className="h-3.5 w-44" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 sm:p-4 space-y-2.5 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>

              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-6 w-20 rounded-lg shrink-0" />
              </div>

              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
          ))}
        </div>
      </div>

      {/* 5. Section 3: Protokol Pemulihan & Nutrisi Skeleton */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <Skeleton className="w-3.5 h-3.5 rounded" />
          <Skeleton className="h-3.5 w-40" />
        </div>

        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-100 dark:border-zinc-800 flex items-start gap-2.5"
            >
              <Skeleton className="w-4 h-4 rounded shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
