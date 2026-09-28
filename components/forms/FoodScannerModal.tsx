'use client';

import React, { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
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
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan pemindaian';
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
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Food Scanner Multimodal
          </h2>
          <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            Vision
          </span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Deteksi otomatis nama hidangan dan estimasi gram makronutrisi dari foto makanan
        </p>
      </div>

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
          className="border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 rounded-md p-6 text-center cursor-pointer transition-colors bg-zinc-50/50 dark:bg-zinc-900/50"
        >
          <Camera className="w-5 h-5 mx-auto text-zinc-400 mb-2" />
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Pilih atau seret foto makanan di sini
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Mendukung format JPG, PNG, WEBP</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-md overflow-hidden max-h-52 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview Makanan"
              className="max-h-52 object-contain rounded"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded border border-rose-200 dark:border-rose-900/60">
              {error}
            </div>
          )}

          {!result ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUploadAndScan}
                disabled={isLoading}
                className="flex-1 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menganalisis nutrisi...</span>
                  </>
                ) : (
                  <span>Analisis Foto</span>
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-xs transition-colors"
              >
                Ganti
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  {result.foodName}
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60">
                  Tersimpan
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs tabular-nums">
                <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">Kalori</div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {result.calories} <span className="text-[10px] font-normal text-zinc-500">kkal</span>
                  </div>
                </div>
                <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">Protein</div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {result.proteinG}g
                  </div>
                </div>
                <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">Karbo</div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {result.carbsG}g
                  </div>
                </div>
                <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">Lemak</div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {result.fatG}g
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full text-center text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 pt-1"
              >
                Scan foto makanan lain
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
