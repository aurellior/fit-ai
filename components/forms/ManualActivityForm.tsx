'use client';

import React, { useState, useEffect } from 'react';
import { createManualActivity } from '@/actions/activity';
import { ActivityType } from '@prisma/client';
import { getWibDateTimeLocalString } from '@/lib/timezone';

interface ManualActivityFormProps {
  onSuccess?: () => void;
  isModal?: boolean;
  initialData?: {
    title?: string;
    distanceKm?: number;
    durationMinutes?: number;
    notes?: string;
  };
}

export default function ManualActivityForm({
  onSuccess,
  isModal = false,
  initialData,
}: ManualActivityFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [startTime, setStartTime] = useState(() => getWibDateTimeLocalString());
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(
    initialData?.durationMinutes ?? ''
  );
  const [distanceKm, setDistanceKm] = useState<number | ''>(
    initialData?.distanceKm ?? ''
  );
  const [calories, setCalories] = useState<number | ''>('');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (initialData) {
      if (initialData.title) setTitle(initialData.title);
      if (initialData.distanceKm !== undefined) setDistanceKm(initialData.distanceKm);
      if (initialData.durationMinutes !== undefined) setDurationMinutes(initialData.durationMinutes);
      if (initialData.notes) setNotes(initialData.notes);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const payload = {
      type: ActivityType.RUN,
      title: title.trim() || 'Sesi Lari',
      startTime,
      durationMinutes: Number(durationMinutes),
      distanceKm: distanceKm !== '' ? Number(distanceKm) : null,
      calories: calories !== '' ? Number(calories) : null,
      notes: notes.trim() || null,
      gymSets: null,
    };

    const res = await createManualActivity(payload);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: 'success', message: 'Sesi lari berhasil dicatat.' });
      setTitle('');
      setNotes('');
      setDurationMinutes('');
      setDistanceKm('');
      setCalories('');
      if (onSuccess) onSuccess();
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Periksa kembali data lari yang dimasukkan.',
      });
    }
  };

  return (
    <div className={isModal ? 'space-y-4' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5'}>
      {!isModal && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Catat Sesi Lari Manual
            </h2>
            <p className="text-xs text-zinc-500">
              Input data lari manual tanpa sinkronisasi GPS Strava
            </p>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`p-3 rounded text-xs font-medium mb-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
            Judul Sesi
          </label>
          <input
            type="text"
            required
            placeholder="Misal: Morning Easy Run, Interval 5K, Tempo Run"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 min-h-[44px] bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg text-base sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FC5200] focus:border-[#FC5200] transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
              Waktu Mulai
            </label>
            <input
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg text-base sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#FC5200] focus:border-[#FC5200] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
              Durasi (Menit)
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="35"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg text-base sm:text-sm text-zinc-900 dark:text-zinc-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-[#FC5200] focus:border-[#FC5200] transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
              Jarak (km)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.1"
              required
              placeholder="5.0"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg text-base sm:text-sm text-zinc-900 dark:text-zinc-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-[#FC5200] focus:border-[#FC5200] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
              Kalori (kkal, opsional)
            </label>
            <input
              type="number"
              placeholder="320"
              value={calories}
              onChange={(e) => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg text-base sm:text-sm text-zinc-900 dark:text-zinc-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-[#FC5200] focus:border-[#FC5200] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
            Catatan Sesi (Opsional)
          </label>
          <textarea
            rows={2}
            placeholder="Kondisi cuaca, rute, sensasi kaki, atau target tercapai..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 min-h-[64px] bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg text-base sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FC5200] focus:border-[#FC5200] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 sm:py-2 bg-[#FC5200] hover:bg-[#E04800] text-white rounded-lg text-xs font-semibold flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer shadow-xs min-h-[44px] active:scale-98"
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Sesi Lari'}
        </button>
      </form>
    </div>
  );
}
