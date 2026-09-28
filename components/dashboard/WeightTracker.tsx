'use client';

import React, { useState } from 'react';
import { logWeight } from '@/actions/weight';
import { formatDate } from '@/lib/utils';
import { WeightLogData } from '@/types';

interface WeightTrackerProps {
  logs: WeightLogData[];
  onWeightLogged?: () => void;
}

export default function WeightTracker({ logs, onWeightLogged }: WeightTrackerProps) {
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightKg) return;

    setIsSubmitting(true);
    const res = await logWeight({ weightKg: Number(weightKg), notes });
    setIsSubmitting(false);

    if (res.success) {
      setIsSuccess(true);
      setWeightKg('');
      setNotes('');
      setTimeout(() => setIsSuccess(false), 2500);
      if (onWeightLogged) onWeightLogged();
    }
  };

  const latestWeight = logs[0]?.weightKg || null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Log Berat Badan
          </h3>
          <p className="text-xs text-zinc-500">Monitoring massa dan komposisi tubuh</p>
        </div>

        {latestWeight && (
          <div className="text-right">
            <span className="text-[10px] uppercase text-zinc-400 block font-medium">Terakhir</span>
            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums font-mono">
              {latestWeight} <span className="text-xs font-normal text-zinc-500">kg</span>
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-3.5">
        <input
          type="number"
          step="0.1"
          required
          placeholder="kg"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-20 px-2.5 py-1.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded text-xs tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
        />
        <input
          type="text"
          placeholder="Catatan (misal: pagi sebelum sarapan)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="flex-1 px-2.5 py-1.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded text-xs font-medium transition-colors disabled:opacity-50"
        >
          {isSuccess ? 'Tercatat' : isSubmitting ? '...' : 'Catat'}
        </button>
      </form>

      <div className="space-y-1 max-h-36 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-2">Belum ada riwayat berat badan.</p>
        ) : (
          logs.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between text-xs py-1 px-2 rounded bg-zinc-50 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300 tabular-nums"
            >
              <span className="font-mono font-medium">{log.weightKg} kg</span>
              <span className="text-[11px] text-zinc-400">{formatDate(log.loggedAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
