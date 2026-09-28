'use client';

import React, { useState } from 'react';
import { Sparkles, Trophy, Lightbulb, RefreshCw, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { AiInsightData } from '@/types';

interface WeeklyAiInsightProps {
  initialInsight?: AiInsightData | null;
}

export default function WeeklyAiInsight({ initialInsight }: WeeklyAiInsightProps) {
  const [insight, setInsight] = useState<AiInsightData | null>(initialInsight || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/insights', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghasilkan analisis AI');
      }
      setInsight(json.data);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/10 via-purple-900/5 to-slate-900/0 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-6 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl shadow-md shadow-indigo-500/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Gemini AI Sports Scientist
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 rounded-md">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Evaluasi performa berkala dan saran pemulihan otomatis dari kecerdasan buatan
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="self-start sm:self-auto px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Menganalisis Data...' : 'Minta Analisis Baru'}</span>
        </button>
      </div>

      {error && (
        <div className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {insight ? (
        <div className="space-y-4">
          <div className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Ringkasan Evaluasi
            </h4>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {insight.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/50 dark:border-emerald-900/40">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs uppercase tracking-wider mb-2">
                <Trophy className="w-4 h-4 text-emerald-600" />
                <span>Kekuatan & Kemajuan</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {insight.strengths}
              </p>
            </div>

            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200/50 dark:border-amber-900/40">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs uppercase tracking-wider mb-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>Rekomendasi Minggu Depan</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {insight.recommendations}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Dibuat pada {formatDate(insight.createdAt)}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 mb-3">
            Belum ada analisis performa mingguan yang digenerate.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Analisis Sekarang</span>
          </button>
        </div>
      )}
    </div>
  );
}
