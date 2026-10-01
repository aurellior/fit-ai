'use client';

import React, { useState, useRef } from 'react';
import { Camera, Loader2, Sparkles, CheckCircle2, RotateCcw, Send } from 'lucide-react';
import { FoodLogData } from '@/types';

interface FoodScannerModalProps {
  onScanSuccess?: () => void;
  isModal?: boolean;
}

const QUICK_FOOD_PROMPTS = [
  '1 porsi nasi goreng spesial + telur ceplok',
  'Dada ayam panggang 150g + nasi merah + brokoli rebus',
  'Oatmeal 100g + 1 buah pisang + 1 scoop whey protein',
  '3 butir telur rebus + 1/2 buah alpukat',
];

export default function FoodScannerModal({ onScanSuccess, isModal = false }: FoodScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'vision' | 'text'>('vision');

  // Vision Mode States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text Mode States
  const [textContent, setTextContent] = useState('');

  // Shared States
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FoodLogData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle Tab Switch
  const handleTabSwitch = (tab: 'vision' | 'text') => {
    setActiveTab(tab);
    setError(null);
    setResult(null);
  };

  // Vision: File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  // Vision: Upload and Scan
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

  // Text: Quick Log via Gemini Text Prompt
  const handleTextQuickLog = async () => {
    const trimmed = textContent.trim();
    if (!trimmed) {
      setError('Ketikkan deskripsi makanan Anda terlebih dahulu');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/food-text-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: trimmed }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memproses deskripsi makanan');
      }

      setResult(json.data);
      if (onScanSuccess) onScanSuccess();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan pencatatan teks';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset current state
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setTextContent('');
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Keyboard shortcut Ctrl/Cmd + Enter to submit in text mode
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && textContent.trim()) {
        handleTextQuickLog();
      }
    }
  };

  return (
    <div className={isModal ? 'space-y-4' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5'}>
      {!isModal && (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Pencatatan Nutrisi Makanan
            </h2>
            <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
              AI Powered
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Gunakan kamera untuk deteksi foto atau ketik deskripsi bebas untuk ekstraksi instan
          </p>
        </div>
      )}

      {/* Tabs Selector: Strava Minimalist Style */}
      <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 gap-1 pb-1">
        <button
          type="button"
          onClick={() => handleTabSwitch('vision')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-t-md transition-colors border-b-2 -mb-[5px] ${
            activeTab === 'vision'
              ? 'border-[#FC5200] text-zinc-900 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Pindai Foto (Vision)</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch('text')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-t-md transition-colors border-b-2 -mb-[5px] ${
            activeTab === 'text'
              ? 'border-[#FC5200] text-zinc-900 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FC5200]" />
          <span>Ketik Manual (AI Quick-Log)</span>
        </button>
      </div>

      {/* Tab 1: Vision Mode */}
      {activeTab === 'vision' && (
        <div className="space-y-3 pt-1">
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
              className="border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-[#FC5200]/60 dark:hover:border-[#FC5200]/60 rounded-md p-6 text-center cursor-pointer transition-colors bg-zinc-50/50 dark:bg-zinc-900/50 group"
            >
              <div className="w-9 h-9 mx-auto mb-2 rounded-full bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-[#FC5200] group-hover:scale-105 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
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

              {!result && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleUploadAndScan}
                    disabled={isLoading}
                    className="flex-1 py-2.5 px-3.5 bg-[#FC5200] hover:bg-[#E04800] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm min-h-[44px] cursor-pointer active:scale-98"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menganalisis nutrisi foto...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-3.5 h-3.5" />
                        <span>Analisis Foto Makanan</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isLoading}
                    className="px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs transition-colors min-h-[44px] cursor-pointer"
                  >
                    Ganti
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Text Quick-Log Mode */}
      {activeTab === 'text' && (
        <div className="space-y-3 pt-1">
          {!result ? (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Deskripsi Makanan / Minuman
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Contoh: 1 porsi nasi goreng spesial ditambah telur mata sapi dan 1 gelas es teh manis..."
                    disabled={isLoading}
                    className="w-full text-base sm:text-xs p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FC5200] focus:border-[#FC5200] transition-colors resize-none"
                  />
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1 mt-1">
                    <span>💡 Tip: Sebutkan jumlah/porsi untuk akurasi terbaik</span>
                    <span className="hidden sm:inline">Ctrl + Enter untuk kirim</span>
                  </div>
                </div>
              </div>

              {/* Quick suggestion chips */}
              <div>
                <div className="text-[11px] font-medium text-zinc-500 mb-1.5 flex items-center gap-1">
                  <span>Contoh Cepat:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_FOOD_PROMPTS.map((promptText) => (
                    <button
                      key={promptText}
                      type="button"
                      onClick={() => setTextContent(promptText)}
                      disabled={isLoading}
                      className="text-[11px] text-left px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors border border-zinc-200/60 dark:border-zinc-700/60 cursor-pointer"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTextQuickLog}
                  disabled={isLoading || !textContent.trim()}
                  className="flex-1 py-2.5 px-3.5 bg-[#FC5200] hover:bg-[#E04800] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm min-h-[44px] cursor-pointer active:scale-98"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menganalisis nutrisi teks...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Analisis & Catat Nutrisi</span>
                    </>
                  )}
                </button>
                {textContent && (
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isLoading}
                    className="px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs transition-colors min-h-[44px] cursor-pointer"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded border border-rose-200 dark:border-rose-900/60">
          {error}
        </div>
      )}

      {/* Result Card: Shared across Vision & Text Mode */}
      {result && (
        <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {result.foodName}
            </span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Tersimpan</span>
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
            className="w-full py-1.5 text-center text-xs font-medium text-[#FC5200] hover:text-[#E04800] dark:hover:text-orange-400 flex items-center justify-center gap-1.5 transition-colors border border-dashed border-orange-200 dark:border-orange-950 rounded mt-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Catat Makanan Lain</span>
          </button>
        </div>
      )}
    </div>
  );
}
