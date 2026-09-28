'use client';

import React, { useState } from 'react';
import { createManualActivity } from '@/actions/activity';
import { ActivityType } from '@prisma/client';
import { Trash2, Plus } from 'lucide-react';

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
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
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
            className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
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
              className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
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
              className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 tabular-nums focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
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
                className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 tabular-nums focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
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
                className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 tabular-nums focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
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
                  className="flex gap-2 items-center p-2 rounded-md bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800"
                >
                  <input
                    type="text"
                    placeholder="Nama Latihan"
                    value={set.exercise}
                    onChange={(e) => handleSetChange(idx, 'exercise', e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Set"
                    value={set.sets}
                    onChange={(e) => handleSetChange(idx, 'sets', Number(e.target.value))}
                    className="w-14 px-1.5 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-center tabular-nums text-zinc-900 dark:text-zinc-100"
                    min="1"
                    title="Sets"
                  />
                  <input
                    type="number"
                    placeholder="Reps"
                    value={set.reps}
                    onChange={(e) => handleSetChange(idx, 'reps', Number(e.target.value))}
                    className="w-14 px-1.5 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-center tabular-nums text-zinc-900 dark:text-zinc-100"
                    min="1"
                    title="Reps"
                  />
                  <input
                    type="number"
                    placeholder="kg"
                    value={set.weightKg}
                    onChange={(e) => handleSetChange(idx, 'weightKg', Number(e.target.value))}
                    className="w-16 px-1.5 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-center tabular-nums text-zinc-900 dark:text-zinc-100"
                    min="0"
                    title="Beban (kg)"
                  />
                  {gymSets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSet(idx)}
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
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
            className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-medium rounded-md transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Aktivitas'}
        </button>
      </form>
    </div>
  );
}
