'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import { ActivityData, WeightLogData, FoodLogData } from '@/types';
import { cn } from '@/lib/utils';
import { getWibDateString, getWibDayIndex, WIB_TIMEZONE } from '@/lib/timezone';

interface DashboardChartsProps {
  activities: ActivityData[];
  weightLogs: WeightLogData[];
  foodLogs: FoodLogData[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    name: string;
    color: string;
  }>;
  label?: string;
}

function StravaTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-[#121214]/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg shadow-sm text-xs tabular-nums">
        <p className="font-semibold text-zinc-500 dark:text-zinc-400 text-[11px] mb-1.5 uppercase font-mono tracking-wider">
          {label}
        </p>
        <div className="space-y-1">
          {payload.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}:
              </span>
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export default function DashboardCharts({
  activities,
  weightLogs,
  foodLogs,
}: DashboardChartsProps) {
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d'>('7d');

  // Waktu referensi (mendukung mock data & live data)
  const now = new Date();
  const latestActivityTimestamp =
    activities.length > 0
      ? Math.max(...activities.map((a) => new Date(a.startTime).getTime()))
      : now.getTime();

  const refTime =
    Math.abs(now.getTime() - latestActivityTimestamp) < 30 * 24 * 60 * 60 * 1000
      ? now.getTime()
      : latestActivityTimestamp;

  const numDays = chartPeriod === '7d' ? 7 : 30;

  const refDate = new Date(refTime);
  const currentDayOfWeek = getWibDayIndex(refDate);
  const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const mondayOfCurrentWeek = new Date(refDate);
  mondayOfCurrentWeek.setDate(refDate.getDate() + distanceToMonday);
  mondayOfCurrentWeek.setHours(0, 0, 0, 0);

  // 1. Process Activity Data (Distance & Duration)
  const activityDays = Array.from({ length: numDays }).map((_, i) => {
    let d: Date;
    if (chartPeriod === '7d') {
      // Senin (i=0) sampai Minggu (i=6)
      d = new Date(mondayOfCurrentWeek);
      d.setDate(mondayOfCurrentWeek.getDate() + i);
    } else {
      // 30 hari terakhir
      d = new Date(refTime);
      d.setDate(d.getDate() - (numDays - 1 - i));
    }
    const dayStr = getWibDateString(d);
    const label =
      numDays === 7
        ? d.toLocaleDateString('id-ID', { timeZone: WIB_TIMEZONE, weekday: 'short', day: 'numeric' })
        : d.toLocaleDateString('id-ID', { timeZone: WIB_TIMEZONE, day: 'numeric', month: 'short' });
    return { date: dayStr, label, distanceKm: 0, durationMin: 0 };
  });

  activities.forEach((act) => {
    const actDate = getWibDateString(act.startTime);
    const target = activityDays.find((d) => d.date === actDate);
    if (target) {
      if (act.distanceMeters) {
        target.distanceKm = Number((target.distanceKm + act.distanceMeters / 1000).toFixed(2));
      }
      target.durationMin += Math.round(act.durationSec / 60);
    }
  });

  const totalPeriodKm = activityDays.reduce((acc, d) => acc + d.distanceKm, 0).toFixed(1);

  // 2. Process Weight Trend Data
  const weightDays = Array.from({ length: numDays }).map((_, i) => {
    let d: Date;
    if (chartPeriod === '7d') {
      d = new Date(mondayOfCurrentWeek);
      d.setDate(mondayOfCurrentWeek.getDate() + i);
    } else {
      d = new Date(refTime);
      d.setDate(d.getDate() - (numDays - 1 - i));
    }
    const dayStr = getWibDateString(d);
    const label =
      numDays === 7
        ? d.toLocaleDateString('id-ID', { timeZone: WIB_TIMEZONE, weekday: 'short', day: 'numeric' })
        : d.toLocaleDateString('id-ID', { timeZone: WIB_TIMEZONE, day: 'numeric', month: 'short' });
    return { date: dayStr, label, weightKg: null as number | null, calories: 0 };
  });

  foodLogs.forEach((food) => {
    const fDate = getWibDateString(food.loggedAt);
    const target = weightDays.find((d) => d.date === fDate);
    if (target) {
      target.calories += Math.round(food.calories);
    }
  });

  let lastKnownWeight = weightLogs[0]?.weightKg || 68.0;
  weightDays.forEach((day) => {
    const log = weightLogs.find(
      (w) => getWibDateString(w.loggedAt) === day.date
    );
    if (log) {
      day.weightKg = log.weightKg;
      lastKnownWeight = log.weightKg;
    } else {
      day.weightKg = lastKnownWeight;
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
      {/* Chart 1: Volume Latihan Mingguan / Bulanan (Strava Signature Orange) */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between min-w-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FC5200]" />
              <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Volume Latihan
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {chartPeriod === '7d'
                ? 'Jarak tempuh harian pekan ini (Senin – Minggu)'
                : 'Tren jarak tempuh 30 hari terakhir'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Quick Chart Filter */}
            <div className="inline-flex p-0.5 bg-zinc-100 dark:bg-zinc-800/90 rounded-md border border-zinc-200/80 dark:border-zinc-700/80 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setChartPeriod('7d')}
                className={cn(
                  'px-2.5 py-1 rounded transition-all cursor-pointer',
                  chartPeriod === '7d'
                    ? 'bg-white dark:bg-zinc-900 text-[#FC5200] font-semibold shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                )}
              >
                Pekan Ini
              </button>
              <button
                type="button"
                onClick={() => setChartPeriod('30d')}
                className={cn(
                  'px-2.5 py-1 rounded transition-all cursor-pointer',
                  chartPeriod === '30d'
                    ? 'bg-white dark:bg-zinc-900 text-[#FC5200] font-semibold shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                )}
              >
                30 Hari
              </button>
            </div>

            <div className="text-right pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] uppercase font-mono text-zinc-400 block">
                {chartPeriod === '7d' ? 'Total Pekan Ini' : 'Total 30H'}
              </span>
              <span className="text-base font-bold font-mono text-[#FC5200] tabular-nums">
                {totalPeriodKm} <span className="text-xs font-normal text-zinc-500">km</span>
              </span>
            </div>
          </div>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityDays} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="2 2"
                vertical={false}
                stroke="#71717a"
                strokeOpacity={0.15}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#71717a' }}
                interval={chartPeriod === '30d' ? 4 : 0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#71717a' }}
                unit="k"
              />
              <Tooltip
                content={<StravaTooltip />}
                cursor={{ fill: 'rgba(252, 82, 0, 0.06)' }}
              />
              <Bar
                dataKey="distanceKm"
                name="Jarak (km)"
                fill="#FC5200"
                radius={[4, 4, 0, 0]}
                maxBarSize={chartPeriod === '30d' ? 12 : 32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Tren Massa Tubuh (Emerald Health Curve) */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between min-w-0 overflow-hidden">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Tren Massa Tubuh
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {chartPeriod === '7d'
                ? 'Fluktuasi berat badan (kg) pekan ini (Senin – Minggu)'
                : 'Fluktuasi berat badan (kg) 30 hari terakhir'}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-zinc-400 block">Status Terakhir</span>
            <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {lastKnownWeight} <span className="text-xs font-normal text-zinc-500">kg</span>
            </span>
          </div>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weightDays} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="2 2"
                vertical={false}
                stroke="#71717a"
                strokeOpacity={0.15}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#71717a' }}
                interval={chartPeriod === '30d' ? 4 : 0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#71717a' }}
                domain={['dataMin - 1', 'dataMax + 1']}
                unit="kg"
              />
              <Tooltip content={<StravaTooltip />} />
              <Area
                type="monotone"
                dataKey="weightKg"
                name="Berat (kg)"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#weightGrad)"
                dot={{ r: chartPeriod === '30d' ? 2 : 3, fill: '#10B981', strokeWidth: 1 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
