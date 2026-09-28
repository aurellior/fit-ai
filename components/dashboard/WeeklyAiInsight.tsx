'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
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
        throw new Error(json.error || 'Gagal menghasilkan analisis performa');
      }
      setInsight(json.data);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kegagalan sistem';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Analisis Performa Mingguan
            </h2>
            <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
              Gemini 2.5 Flash
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Evaluasi beban latihan gabungan (Strava + Gym) dan adaptasi fisik 7 hari terakhir
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="self-start sm:self-auto text-xs font-medium px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Menganalisis...' : 'Perbarui Analisis'}</span>
        </button>
      </div>

      {error && (
        <div className="mt-4 text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded border border-rose-200 dark:border-rose-900/60">
          {error}
        </div>
      )}

      {insight ? (
        <div className="mt-5 space-y-5">
          <div>
            <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Ringkasan Evaluasi
            </h3>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
              {insight.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-md bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Kemajuan & Kekuatan
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {insight.strengths}
              </p>
            </div>

            <div className="p-4 rounded-md bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                Rekomendasi Pemulihan & Beban
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {insight.recommendations}
              </p>
            </div>
          </div>

          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
            <span>Terakhir dianalisis: {formatDate(insight.createdAt)}</span>
            <span className="font-mono">Status: Evaluated</span>
          </div>
        </div>
      ) : (
        <div className="mt-5 py-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-md">
          <p className="text-xs text-zinc-500">
            Belum ada evaluasi tersimpan untuk periode ini.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="mt-3 text-xs font-medium px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded transition-colors"
          >
            Minta Evaluasi Sekarang
          </button>
        </div>
      )}
    </div>
  );
}
