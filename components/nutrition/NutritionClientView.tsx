'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FoodLogData, DailyNutritionAuditData } from '@/types';
import { formatDate } from '@/lib/utils';
import { deleteFoodLog } from '@/actions/nutrition';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import FoodScannerModal from '@/components/forms/FoodScannerModal';
import ManualActivityForm from '@/components/forms/ManualActivityForm';
import LogWeightModalForm from '@/components/forms/LogWeightModalForm';
import BottomNav from '@/components/navigation/BottomNav';
import DailyNutritionAuditHistory from '@/components/nutrition/DailyNutritionAuditHistory';
import {
  Camera,
  Trash2,
  Search,
  ArrowLeft,
} from 'lucide-react';

interface NutritionClientViewProps {
  initialFoodLogs: FoodLogData[];
  initialAuditHistory?: DailyNutritionAuditData[];
  itemsPerPage?: number;
}

export default function NutritionClientView({
  initialFoodLogs,
  initialAuditHistory,
  itemsPerPage = 8,
}: NutritionClientViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  // Totals
  const totalCalories = initialFoodLogs.reduce((acc, curr) => acc + curr.calories, 0);
  const totalProtein = initialFoodLogs.reduce((acc, curr) => acc + curr.proteinG, 0);
  const totalCarbs = initialFoodLogs.reduce((acc, curr) => acc + curr.carbsG, 0);
  const totalFat = initialFoodLogs.reduce((acc, curr) => acc + curr.fatG, 0);

  // Filter
  const filteredLogs = initialFoodLogs.filter((food) => {
    if (!searchQuery.trim()) return true;
    return food.foodName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const validPage = Math.min(page, totalPages);
  const startIndex = (validPage - 1) * itemsPerPage;
  const paginatedList = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (id: string) => {
    if (confirm('Hapus log makanan ini?')) {
      await deleteFoodLog(id);
      startTransition(() => {
        router.refresh();
      });
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* 1. Breadcrumbs & Header */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-1">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3 h-3" />
            <span>Overview</span>
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Nutrisi</span>
        </div>

        <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase font-mono">
              Nutrisi & Log Makanan
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsFoodModalOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#FC5200] hover:bg-[#E04900] text-white transition-colors flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Daily Nutrition Audit & Energy Balance History (7-Day Overview & AI Evaluation) */}
      {initialAuditHistory && initialAuditHistory.length > 0 && (
        <section>
          <DailyNutritionAuditHistory initialHistory={initialAuditHistory} />
        </section>
      )}

      {/* 3. Macronutrient Cards Grid in 2x2 Mobile Layout */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 sm:p-4 bg-white dark:bg-[#121214] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
          <span className="text-[10px] text-zinc-400 uppercase font-mono font-semibold block">Total Energi</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">
            {Math.round(totalCalories)}{' '}
            <span className="text-[10px] font-normal text-zinc-500 font-sans">kkal</span>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-white dark:bg-[#121214] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
          <span className="text-[10px] text-zinc-400 uppercase font-mono font-semibold block">Protein</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#FC5200] mt-0.5 tabular-nums">
            {Math.round(totalProtein)}{' '}
            <span className="text-[10px] font-normal text-zinc-500 font-sans">gram</span>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-white dark:bg-[#121214] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
          <span className="text-[10px] text-zinc-400 uppercase font-mono font-semibold block">Karbohidrat</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 tabular-nums">
            {Math.round(totalCarbs)}{' '}
            <span className="text-[10px] font-normal text-zinc-500 font-sans">gram</span>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-white dark:bg-[#121214] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
          <span className="text-[10px] text-zinc-400 uppercase font-mono font-semibold block">Lemak</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
            {Math.round(totalFat)}{' '}
            <span className="text-[10px] font-normal text-zinc-500 font-sans">gram</span>
          </div>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama makanan (misal: telur, dada ayam, salmon)..."
            className="w-full text-base sm:text-sm pl-9 pr-3.5 py-2.5 min-h-[44px] rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FC5200] focus:border-[#FC5200] transition-colors"
          />
        </div>
      </div>

      {/* 4. Food Logs List */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Daftar Makanan Tercatat
          </h2>
          <span className="text-xs font-mono text-zinc-500 font-semibold">
            {filteredLogs.length} entri
          </span>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {paginatedList.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-xs">
              Tidak ada catatan makanan yang cocok dengan pencarian.
            </div>
          ) : (
            paginatedList.map((food) => (
              <div
                key={food.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
              >
                <div>
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    {food.foodName}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {formatDate(food.loggedAt)}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right text-xs">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono text-sm">
                      {food.calories} kkal
                    </span>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      P: <strong className="text-zinc-800 dark:text-zinc-200">{food.proteinG}g</strong> •{' '}
                      C: <strong className="text-zinc-800 dark:text-zinc-200">{food.carbsG}g</strong> •{' '}
                      L: <strong className="text-zinc-800 dark:text-zinc-200">{food.fatG}g</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(food.id)}
                    className="text-zinc-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Hapus log makanan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
          <Pagination
            currentPage={validPage}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
            totalItems={filteredLogs.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isFoodModalOpen}
        onClose={() => setIsFoodModalOpen(false)}
        title="Catat Nutrisi Makanan (AI Vision & Quick-Log)"
        description="Pindai foto makanan atau ketik menu bebas untuk estimasi makronutrisi & kalori instan dengan Gemini AI"
        maxWidth="md"
      >
        <FoodScannerModal
          isModal
          onScanSuccess={() => {
            setIsFoodModalOpen(false);
            startTransition(() => router.refresh());
          }}
        />
      </Modal>

      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Catat Aktivitas Latihan"
        maxWidth="lg"
      >
        <ManualActivityForm
          isModal
          onSuccess={() => {
            setIsActivityModalOpen(false);
            startTransition(() => router.refresh());
          }}
        />
      </Modal>

      <Modal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        title="Catat Berat Badan"
        maxWidth="sm"
      >
        <LogWeightModalForm
          onSuccess={() => {
            setIsWeightModalOpen(false);
            startTransition(() => router.refresh());
          }}
        />
      </Modal>

      <BottomNav
        onOpenActivityModal={() => setIsActivityModalOpen(true)}
        onOpenFoodModal={() => setIsFoodModalOpen(true)}
        onOpenWeightModal={() => setIsWeightModalOpen(true)}
      />
    </div>
  );
}
