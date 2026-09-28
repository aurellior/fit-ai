'use client';

import React, { useState } from 'react';
import { createManualActivity } from '@/actions/activity';
import { Plus, Trash2, Dumbbell, Activity as RunIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { ActivityType } from '@prisma/client';

interface GymSetInput {
  exercise: string;
  sets: number;
  reps: number;
  weightKg: number;
}

interface ManualActivityFormProps {
  onSuccess?: () => void;
}

export default function ManualActivityForm({ onSuccess }: ManualActivityFormProps) {
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
      title: title || (activityType === ActivityType.RUN ? 'Lari Sesi Pagi' : 'Latihan Beban Gym'),
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
      setFeedback({ type: 'success', message: 'Sesi aktivitas manual berhasil disimpan!' });
      setTitle('');
      setNotes('');
      setDurationMinutes('');
      setDistanceKm('');
      setCalories('');
      if (onSuccess) onSuccess();
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Terjadi kesalahan saat memvalidasi form.',
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Input Latihan Manual</h2>
          <p className="text-xs text-slate-500">Catat sesi lari atau gym tanpa sinkronisasi Strava</p>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Selector Mode: Lari vs Gym */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => {
            setActivityType(ActivityType.RUN);
            if (!title || title.includes('Gym')) setTitle('Lari Rutin 5K');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all ${
            activityType === ActivityType.RUN
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <RunIcon className="w-4 h-4" /> Lari / Kardio
        </button>
        <button
          type="button"
          onClick={() => {
            setActivityType(ActivityType.WEIGHT_TRAINING);
            if (!title || title.includes('Lari')) setTitle('Sesi Gym / Latihan Beban');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all ${
            activityType === ActivityType.WEIGHT_TRAINING
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Dumbbell className="w-4 h-4" /> Gym / Beban
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
            Judul Sesi
          </label>
          <input
            type="text"
            required
            placeholder={
              activityType === ActivityType.RUN ? 'Contoh: Lari Pagi GBK 5K' : 'Contoh: Push Day (Chest & Triceps)'
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Waktu Mulai
            </label>
            <input
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Durasi (Menit)
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="Contoh: 45"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Input Spesifik Lari */}
        {activityType === ActivityType.RUN && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Jarak Tempuh (km)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                required
                placeholder="Contoh: 5.25"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Kalori Terbakar (kkal)
              </label>
              <input
                type="number"
                placeholder="Contoh: 320"
                value={calories}
                onChange={(e) => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Input Spesifik Gym / Workout Sets */}
        {activityType === ActivityType.WEIGHT_TRAINING && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Log Gerakan & Beban
              </label>
              <button
                type="button"
                onClick={handleAddSet}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Gerakan
              </button>
            </div>

            {gymSets.map((set, idx) => (
              <div
                key={idx}
                className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Nama Latihan (misal: Dumbbell Press)"
                    value={set.exercise}
                    onChange={(e) => handleSetChange(idx, 'exercise', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    required
                  />
                </div>
                <div className="w-16">
                  <input
                    type="number"
                    placeholder="Set"
                    value={set.sets}
                    onChange={(e) => handleSetChange(idx, 'sets', Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                    min="1"
                    title="Set"
                  />
                </div>
                <div className="w-16">
                  <input
                    type="number"
                    placeholder="Reps"
                    value={set.reps}
                    onChange={(e) => handleSetChange(idx, 'reps', Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                    min="1"
                    title="Reps"
                  />
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    placeholder="Beban kg"
                    value={set.weightKg}
                    onChange={(e) => handleSetChange(idx, 'weightKg', Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                    min="0"
                    title="Beban (kg)"
                  />
                </div>
                {gymSets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSet(idx)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
            Catatan Tambahan
          </label>
          <textarea
            rows={2}
            placeholder="Evaluasi rute, detak jantung, atau kondisi otot setelah latihan..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span>Menyimpan ke Database...</span>
          ) : (
            <span>Simpan Sesi Aktivitas</span>
          )}
        </button>
      </form>
    </div>
  );
}
