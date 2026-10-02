'use client';

import React, { useState } from 'react';
import { createManualActivity } from '@/actions/activity';
import { ActivityType } from '@prisma/client';
import { Trash2, Plus } from 'lucide-react';
import { getWibDateTimeLocalString } from '@/lib/timezone';

interface GymSetInput {
  exercise: string;
  sets: number;
  reps: number;
  weightKg: number;
}

interface ManualActivityFormProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

export default function ManualActivityForm({ onSuccess, isModal = false }: ManualActivityFormProps) {
  const [activityType, setActivityType] = useState<ActivityType>(ActivityType.RUN);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState(() => getWibDateTimeLocalString());
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');
  const [distanceKm, setDistanceKm] = useState<number | ''>('');
  const [calories, setCalories] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Dynamic Gym Sets
  const [gymSets, setGymSets] = useState<GymSetInput[]>([
    { exercise: 'Bench Press', sets: 3, reps: 10, weightKg: 60 },
  ]);

  const handleAddSet = () => {
    setGymSets([...gymSets, { exercise: '', sets: 3, reps: 10, weightKg: 0 }]);
  };

  const handleRemoveSet = (index: number) => {
    setGymSets(gymSets.filter((_, i) => i !== index));
  };

  const handleSetChange = (index: number, field: keyof GymSetInput, value: string | number) => {
    const updated = [...gymSets];
    updated[index] = { ...updated[index], [field]: value };
    setGymSets(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const payload = {
      type: activityType,
      title: title || (activityType === ActivityType.RUN ? 'Sesi Lari' : 'Sesi Latihan Beban'),
      startTime,
      durationMinutes: Number(durationMinutes),
      distanceKm: activityType === ActivityType.RUN && distanceKm !== '' ? Number(distanceKm) : null,
      calories: calories !== '' ? Number(calories) : null,
      notes: notes || null,
      gymSets: activityType === ActivityType.WEIGHT_TRAINING ? gymSets : null,
    };

    const res = await createManualActivity(payload);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: 'success', message: 'Aktivitas berhasil dicatat.' });
      setTitle('');
      setNotes('');
      setDurationMinutes('');
      setDistanceKm('');
      setCalories('');
      if (onSuccess) onSuccess();
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Periksa kembali data input.',
      });
    }
  };

  return (
    <div className={isModal ? 'space-y-4' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5'}>
      {!isModal && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Catat Aktivitas Manual
            </h2>
            <p className="text-xs text-zinc-500">
              Pencatatan sesi latihan mandiri tanpa sinkronisasi GPS Strava
            </p>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`p-3 rounded text-xs font-medium mb-4 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Segmented Control */}
      <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-md mb-4 text-xs font-medium">
        <button
          type="button"
          onClick={() => {
            setActivityType(ActivityType.RUN);
            if (!title || title.includes('Beban')) setTitle('Lari Rutin');
          }}
          className={`py-1.5 rounded transition-all ${
            activityType === ActivityType.RUN
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          Lari & Kardio
        </button>
        <button
          type="button"
          onClick={() => {
            setActivityType(ActivityType.WEIGHT_TRAINING);
            if (!title || title.includes('Lari')) setTitle('Sesi Gym');
          }}
          className={`py-1.5 rounded transition-all ${
            activityType === ActivityType.WEIGHT_TRAINING
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          Gym & Latihan Beban
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
            Judul Sesi
          </label>
          <input
            type="text"
            required
            placeholder={activityType === ActivityType.RUN ? 'Misal: Easy Run 5K' : 'Misal: Chest & Triceps'}
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
              placeholder="45"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg text-base sm:text-sm text-zinc-900 dark:text-zinc-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-[#FC5200] focus:border-[#FC5200] transition-colors"
            />
          </div>
        </div>

        {activityType === ActivityType.RUN && (
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
                Kalori (kkal)
              </label>
              <input
                type="number"
                placeholder="300"
                value={calories}
                onChange={(e) => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg text-base sm:text-sm text-zinc-900 dark:text-zinc-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-[#FC5200] focus:border-[#FC5200] transition-colors"
              />
            </div>
          </div>
        )}

        {activityType === ActivityType.WEIGHT_TRAINING && (
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Log Gerakan Beban
              </span>
              <button
                type="button"
                onClick={handleAddSet}
                className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 font-medium"
              >
                <Plus className="w-3 h-3" /> Tambah Gerakan
              </button>
            </div>

            <div className="space-y-2">
              {gymSets.map((set, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800"
                >
                  <input
                    type="text"
                    placeholder="Nama Latihan (misal: Bench Press)"
                    value={set.exercise}
                    onChange={(e) => handleSetChange(idx, 'exercise', e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 min-h-[42px] text-base sm:text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#FC5200] focus:border-[#FC5200]"
                    required
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="relative flex-1 sm:w-16">
                      <input
                        type="number"
                        placeholder="Set"
                        value={set.sets}
                        onChange={(e) => handleSetChange(idx, 'sets', Number(e.target.value))}
                        className="w-full px-2 py-2 min-h-[42px] text-base sm:text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-center tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#FC5200] focus:border-[#FC5200]"
                        min="1"
                        title="Sets"
                      />
                    </div>
                    <span className="text-zinc-400 text-xs font-mono">×</span>
                    <div className="relative flex-1 sm:w-16">
                      <input
                        type="number"
                        placeholder="Reps"
                        value={set.reps}
                        onChange={(e) => handleSetChange(idx, 'reps', Number(e.target.value))}
                        className="w-full px-2 py-2 min-h-[42px] text-base sm:text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-center tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#FC5200] focus:border-[#FC5200]"
                        min="1"
                        title="Reps"
                      />
                    </div>
                    <span className="text-zinc-400 text-xs font-mono">@</span>
                    <div className="relative flex-1 sm:w-20">
                      <input
                        type="number"
                        placeholder="kg"
                        value={set.weightKg}
                        onChange={(e) => handleSetChange(idx, 'weightKg', Number(e.target.value))}
                        className="w-full px-2 py-2 min-h-[42px] text-base sm:text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-center tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#FC5200] focus:border-[#FC5200]"
                        min="0"
                        title="Beban (kg)"
                      />
                    </div>
                    {gymSets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSet(idx)}
                        className="min-w-[36px] min-h-[36px] flex items-center justify-center text-zinc-400 hover:text-rose-600 rounded transition-colors"
                        aria-label="Hapus gerakan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
            Catatan
          </label>
          <textarea
            rows={2}
            placeholder="Catatan kelelahan, sensasi latihan, atau beban..."
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
          {isSubmitting ? 'Menyimpan...' : 'Simpan Aktivitas'}
        </button>
      </form>
    </div>
  );
}
