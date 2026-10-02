'use client';

import React, { useState } from 'react';
import { logWeight } from '@/actions/weight';

interface LogWeightModalFormProps {
  onSuccess?: () => void;
}

export default function LogWeightModalForm({ onSuccess }: LogWeightModalFormProps) {
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightKg) return;

    setIsSubmitting(true);
    setError(null);
    const res = await logWeight({ weightKg: Number(weightKg), notes });
    setIsSubmitting(false);

    if (res.success) {
      setWeightKg('');
      setNotes('');
      if (onSuccess) onSuccess();
    } else {
      setError(res.error || 'Gagal menyimpan catatan berat badan');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded border border-rose-200 dark:border-rose-900/60">
          {error}
        </div>
      )}

      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
          Berat Badan (kg)
        </label>
        <input
          type="number"
          step="0.1"
          required
          placeholder="68.5"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full px-3.5 py-2.5 bg-zinc-50/50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg text-base sm:text-sm tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
        />
      </div>

      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
          Catatan Kondisi (Opsional)
        </label>
        <input
          type="text"
          placeholder="Misal: Pagi setelah bangun tidur / puasa"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-zinc-50/50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg text-base sm:text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 sm:py-2 bg-[#FC5200] hover:bg-[#E04900] text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs active:scale-98"
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Log Berat Badan'}
        </button>
      </div>
    </form>
  );
}
