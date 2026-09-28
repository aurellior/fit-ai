'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ActivityData, WeightLogData, FoodLogData } from '@/types';

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

function MinimalTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded shadow-sm text-xs tabular-nums">
        <p className="font-medium text-zinc-500 mb-1">{label}</p>
        {payload.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-zinc-600 dark:text-zinc-400">{item.name}:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
              {item.value}
            </span>
          </div>
        ))}
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
  // 1. Process 7-day Activity Data (Distance & Duration)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
    return { date: dayStr, label, distanceKm: 0, durationMin: 0 };
  });

  activities.forEach((act) => {
    const actDate = new Date(act.startTime).toISOString().split('T')[0];
    const target = last7Days.find((d) => d.date === actDate);
    if (target) {
      if (act.distanceMeters) {
        target.distanceKm = Number((target.distanceKm + act.distanceMeters / 1000).toFixed(2));
      }
      target.durationMin += Math.round(act.durationSec / 60);
    }
  });

  // 2. Process Weight & Calorie Trend Data
  const last7DaysWeight = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
    return { date: dayStr, label, weightKg: null as number | null, calories: 0 };
  });

  // Map food logs
  foodLogs.forEach((food) => {
    const fDate = new Date(food.loggedAt).toISOString().split('T')[0];
    const target = last7DaysWeight.find((d) => d.date === fDate);
    if (target) {
      target.calories += Math.round(food.calories);
    }
  });

  // Map latest weight logs (or propagate latest available)
  let lastKnownWeight = weightLogs[0]?.weightKg || 68.0;
  last7DaysWeight.forEach((day) => {
    const log = weightLogs.find(
      (w) => new Date(w.loggedAt).toISOString().split('T')[0] === day.date
    );
    if (log) {
      day.weightKg = log.weightKg;
      lastKnownWeight = log.weightKg;
    } else {
      day.weightKg = lastKnownWeight;
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 min-w-0">
      {/* Chart 1: Volume Latihan (Jarak & Durasi) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 sm:p-5 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Tren Jarak & Volume Latihan
            </h3>
            <p className="text-xs text-zinc-500">Total kilometer harian 7 hari terakhir</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#FC5200]"></span> Jarak (km)
            </span>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e4e4e7"
                className="dark:stroke-zinc-800/80"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#71717a' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#71717a' }}
                unit="k"
              />
              <Tooltip content={<MinimalTooltip />} cursor={{ fill: 'transparent' }} />
              <Bar
                dataKey="distanceKm"
                name="Jarak"
                fill="#FC5200"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Tren Berat Badan & Kalori */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 sm:p-5 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Tren Berat Badan & Asupan Kalori
            </h3>
            <p className="text-xs text-zinc-500">Massa tubuh (kg) dan kalori masuk harian</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Berat (kg)
            </span>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={last7DaysWeight}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e4e4e7"
                className="dark:stroke-zinc-800/80"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#71717a' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#71717a' }}
                domain={['dataMin - 1', 'dataMax + 1']}
                unit="kg"
              />
              <Tooltip content={<MinimalTooltip />} />
              <Line
                type="monotone"
                dataKey="weightKg"
                name="Berat Badan (kg)"
                stroke="#059669"
                strokeWidth={2}
                dot={{ r: 3, fill: '#059669' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
