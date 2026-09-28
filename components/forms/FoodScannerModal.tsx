'use client';

import React, { useState, useRef } from 'react';
import { Camera, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';
import { FoodLogData } from '@/types';

interface FoodScannerModalProps {
  onScanSuccess?: () => void;
}

export default function FoodScannerModal({ onScanSuccess }: FoodScannerModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FoodLogData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleUploadAndScan = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await fetch('/api/ai/food-scanner', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memproses gambar');
      }

      setResult(json.data);
      if (onScanSuccess) onScanSuccess();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan saat pemindaian foto';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-purple-100 dark:bg-purple-950/60 rounded-xl text-purple-600 dark:text-purple-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Food Scanner (Multimodal)</h2>
          <p className="text-xs text-slate-500">
            Unggah foto piring makanan Anda untuk estimasi kalori & makronutrisi otomatis
          </p>
        </div>
      </div>

      <div className="mt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {!previewUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-400 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30"
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 mb-3">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Klik untuk mengambil foto atau pilih gambar makanan
            </p>
            <p className="text-xs text-slate-400 mt-1">Mendukung file JPG, PNG, atau WEBP</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden max-h-60 bg-black/5 dark:bg-black/40 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Preview Makanan"
                className="max-h-60 object-contain rounded-xl"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 rounded-xl text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!result ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleUploadAndScan}
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 active:scale-[0.99] disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gemini AI Sedang Menganalisis...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Mulai Scan Nutrisi</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isLoading}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium"
                >
                  Ganti Foto
                </button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                    <Check className="w-5 h-5" />
                    <span>Hasil Deteksi Nutrisi</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-full font-medium">
                    Tersimpan ke Database
                  </span>
                </div>

                <div className="text-base font-semibold text-slate-900 dark:text-white">
                  {result.foodName}
                </div>

                <div className="grid grid-cols-4 gap-2 text-center pt-1">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                    <div className="text-xs text-slate-500">Kalori</div>
                    <div className="text-sm font-bold text-amber-600">{result.calories} kkal</div>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                    <div className="text-xs text-slate-500">Protein</div>
                    <div className="text-sm font-bold text-rose-600">{result.proteinG}g</div>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                    <div className="text-xs text-slate-500">Karbo</div>
                    <div className="text-sm font-bold text-sky-600">{result.carbsG}g</div>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                    <div className="text-xs text-slate-500">Lemak</div>
                    <div className="text-sm font-bold text-amber-500">{result.fatG}g</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold hover:bg-emerald-50 transition-colors"
                >
                  Scan Makanan Lain
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
