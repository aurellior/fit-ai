'use client';

import React, { useState } from 'react';
import { Scale, Plus, Check } from 'lucide-react';
import { logWeight } from '@/actions/weight';
import { formatDate } from '@/lib/utils';

interface WeightLogItem {
  id: string;
  weightKg: number;
  loggedAt: Date | string;
  notes?: string | null;
}

interface WeightTrackerProps {
  logs: WeightLogItem[];
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
      setTimeout(() => setIsSuccess(false), 3000);
      if (onWeightLogged) onWeightLogged();
    }
  };

  const latestWeight = logs[0]?.weightKg || null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-xl">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Pelacak Berat Badan</h3>
            <p className="text-xs text-slate-500">Memonitor progres komposisi tubuh</p>
          </div>
        </div>

        {latestWeight && (
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Terakhir</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {latestWeight} <span className="text-xs font-normal text-slate-500">kg</span>
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="number"
          step="0.1"
          required
          placeholder="Berat (kg)"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-28 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Catatan (opsional: pagi setelah bangun)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
        >
          {isSuccess ? <Check className="w-4 h-4 text-emerald-200" /> : <Plus className="w-4 h-4" />}
          <span>{isSubmitting ? '...' : 'Catat'}</span>
        </button>
      </form>

      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-2">Belum ada riwayat berat badan.</p>
        ) : (
          logs.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between text-xs py-1.5 px-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg"
            >
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {log.weightKg} kg
              </span>
              <span className="text-slate-400">{formatDate(log.loggedAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
