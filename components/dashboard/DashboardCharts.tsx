'use client';

import React from 'react';
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

  const totalWeekKm = last7Days.reduce((acc, d) => acc + d.distanceKm, 0).toFixed(1);

  // 2. Process Weight Trend Data
  const last7DaysWeight = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
    return { date: dayStr, label, weightKg: null as number | null, calories: 0 };
  });

  foodLogs.forEach((food) => {
    const fDate = new Date(food.loggedAt).toISOString().split('T')[0];
    const target = last7DaysWeight.find((d) => d.date === fDate);
    if (target) {
      target.calories += Math.round(food.calories);
    }
  });

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Chart 1: Volume Latihan Mingguan (Strava Signature Orange) */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FC5200]" />
              <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Volume Latihan Mingguan
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Total jarak tempuh harian (7 hari terakhir)
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-zinc-400 block">Akumulasi 7 Hari</span>
            <span className="text-base font-bold font-mono text-[#FC5200]">
              {totalWeekKm} <span className="text-xs font-normal text-zinc-500">km</span>
            </span>
          </div>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
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
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Tren Massa Tubuh (Emerald Health Curve) */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Tren Massa Tubuh
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Fluktuasi berat badan (kg) 7 hari terakhir
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-zinc-400 block">Status Terakhir</span>
            <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {lastKnownWeight} <span className="text-xs font-normal text-zinc-500">kg</span>
            </span>
          </div>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last7DaysWeight} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
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
                dot={{ r: 3, fill: '#10B981', strokeWidth: 1 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
