'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ActivityData, GymSet } from '@/types';
import { ActivitySource, ActivityType } from '@prisma/client';
import {
  formatDuration,
  formatDistance,
  formatPace,
  formatDate,
} from '@/lib/utils';
import {
  Activity,
  Dumbbell,
  Bike,
  Footprints,
  Search,
  Filter,
  ArrowLeft,
  Trash2,
  Plus,
  ArrowUpRight,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ManualActivityForm from '@/components/forms/ManualActivityForm';
import { deleteActivity } from '@/actions/activity';
import BottomNav from '@/components/navigation/BottomNav';
import FoodScannerModal from '@/components/forms/FoodScannerModal';
import LogWeightModalForm from '@/components/forms/LogWeightModalForm';

interface ActivitiesClientViewProps {
  initialActivities: ActivityData[];
  currentPage?: number;
  itemsPerPage?: number;
}

export default function ActivitiesClientView({
  initialActivities,
  currentPage = 1,
  itemsPerPage = 8,
}: ActivitiesClientViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Local state for interactive filtering & pagination
  const [page, setPage] = useState(currentPage);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  // Client-side filtering
  const filteredActivities = initialActivities.filter((item) => {
    // Type filter
    if (selectedType !== 'ALL') {
      if (selectedType === 'RUN' && item.type !== ActivityType.RUN) return false;
      if (selectedType === 'WEIGHT_TRAINING' && item.type !== ActivityType.WEIGHT_TRAINING) return false;
      if (selectedType === 'RIDE' && item.type !== ActivityType.RIDE) return false;
      if (selectedType === 'HIKE_WALK' && item.type !== ActivityType.HIKE && item.type !== ActivityType.WALK) return false;
    }

    // Source filter
    if (selectedSource !== 'ALL' && item.source !== selectedSource) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q) || false;
      const matchGym =
        Array.isArray(item.gymSets) &&
        item.gymSets.some((g: GymSet) => g.exercise.toLowerCase().includes(q));
      if (!matchTitle && !matchNotes && !matchGym) return false;
    }

    return true;
  });

  const calculatedTotalPages = Math.max(1, Math.ceil(filteredActivities.length / itemsPerPage));
  const validPage = Math.min(page, calculatedTotalPages);
  const startIndex = (validPage - 1) * itemsPerPage;
  const paginatedList = filteredActivities.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setPage(1);
  };

  const handleSourceChange = (src: string) => {
    setSelectedSource(src);
    setPage(1);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('Hapus log aktivitas ini?')) {
      await deleteActivity(id);
      startTransition(() => {
        router.refresh();
      });
    }
  };

  const getSportIcon = (type: string) => {
    switch (type) {
      case 'WEIGHT_TRAINING':
        return <Dumbbell className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'RIDE':
        return <Bike className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'WALK':
      case 'HIKE':
        return <Footprints className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Activity className="w-4 h-4 text-[#FC5200]" />;
    }
  };

  const runCount = initialActivities.filter((a) => a.type === ActivityType.RUN).length;
  const gymCount = initialActivities.filter((a) => a.type === ActivityType.WEIGHT_TRAINING).length;
  const rideCount = initialActivities.filter((a) => a.type === ActivityType.RIDE).length;

  return (
    <div className="space-y-6 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-12">
      {/* 1. Breadcrumbs & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Aktivitas</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Riwayat Aktivitas & Latihan
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Eksplorasi daftar lengkap aktivitas olahraga, analisis pace, dan beban latihan dengan pagination.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5 bg-white dark:bg-zinc-900 shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ke Overview</span>
            </Link>

            <button
              onClick={() => setIsActivityModalOpen(true)}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-[#FC5200] hover:bg-[#E04900] text-white transition-colors flex items-center gap-1.5 shadow-xs active:scale-98"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Catat Latihan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Summary Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5">
          <span className="text-[10px] uppercase font-mono text-zinc-400 font-semibold block">Total Aktivitas</span>
          <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
            {initialActivities.length} <span className="text-xs font-normal text-zinc-500">sesi</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5">
          <span className="text-[10px] uppercase font-mono text-zinc-400 font-semibold block">Sesi Lari</span>
          <div className="text-lg font-bold font-mono text-[#FC5200] mt-0.5">
            {runCount} <span className="text-xs font-normal text-zinc-500">kali</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5">
          <span className="text-[10px] uppercase font-mono text-zinc-400 font-semibold block">Latihan Beban (Gym)</span>
          <div className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5">
            {gymCount} <span className="text-xs font-normal text-zinc-500">kali</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5">
          <span className="text-[10px] uppercase font-mono text-zinc-400 font-semibold block">Gowes & Outdoor</span>
          <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            {rideCount + (initialActivities.length - runCount - gymCount - rideCount)}{' '}
            <span className="text-xs font-normal text-zinc-500">sesi</span>
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama aktivitas, catatan rute, atau gerakan gym..."
              className="w-full text-base sm:text-xs pl-8 pr-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          {/* Source Filter Select */}
          <div className="flex items-center gap-2 shrink-0 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-500 text-[11px] whitespace-nowrap">Sumber:</span>
            <select
              value={selectedSource}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="text-base sm:text-xs py-1.5 px-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="ALL">Semua Sumber</option>
              <option value="STRAVA">Strava API</option>
              <option value="MANUAL">Manual Input</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => handleTypeChange('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedType === 'ALL'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Semua ({initialActivities.length})
          </button>
          <button
            onClick={() => handleTypeChange('RUN')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedType === 'RUN'
                ? 'bg-[#FC5200] text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Lari ({runCount})</span>
          </button>
          <button
            onClick={() => handleTypeChange('WEIGHT_TRAINING')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedType === 'WEIGHT_TRAINING'
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Dumbbell className="w-3 h-3" />
            <span>Gym / Beban ({gymCount})</span>
          </button>
          <button
            onClick={() => handleTypeChange('RIDE')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedType === 'RIDE'
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Bike className="w-3 h-3" />
            <span>Sepeda ({rideCount})</span>
          </button>
          <button
            onClick={() => handleTypeChange('HIKE_WALK')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedType === 'HIKE_WALK'
                ? 'bg-amber-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Footprints className="w-3 h-3" />
            <span>Hike & Jalan</span>
          </button>
        </div>
      </div>

      {/* 4. Activity Cards Feed */}
      <div className="space-y-3">
        {paginatedList.length === 0 ? (
          <div className="bg-white dark:bg-[#121214] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center">
            <Filter className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
            <p className="text-zinc-800 dark:text-zinc-200 text-sm font-semibold">
              Tidak ada aktivitas yang sesuai filter
            </p>
            <p className="text-zinc-500 text-xs mt-1">
              Coba gunakan kata kunci berbeda atau reset filter kategori olahraga.
            </p>
            <button
              onClick={() => {
                setSelectedType('ALL');
                setSelectedSource('ALL');
                setSearchQuery('');
              }}
              className="mt-3 text-xs text-[#FC5200] font-semibold hover:underline"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          paginatedList.map((item) => {
            const isStrava = item.source === ActivitySource.STRAVA;
            const sets: GymSet[] | null = Array.isArray(item.gymSets) ? item.gymSets : null;

            return (
              <div
                key={item.id}
                className="group bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl p-4 sm:p-5 transition-all shadow-xs"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 shrink-0">
                      {getSportIcon(item.type)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/activities/${item.id}`}
                          className="font-bold text-base text-zinc-900 dark:text-zinc-100 hover:text-[#FC5200] dark:hover:text-[#FC5200] transition-colors flex items-center gap-1.5"
                        >
                          <span>{item.title}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>

                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold ${
                            isStrava
                              ? 'bg-orange-50 text-[#FC5200] dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50'
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {item.source}
                        </span>

                        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded">
                          {item.type.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-xs text-zinc-500 mt-1">
                        {formatDate(item.startTime)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/activities/${item.id}`}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-[#FC5200] hover:text-white dark:hover:bg-[#FC5200] dark:hover:text-white text-zinc-900 dark:text-zinc-100 transition-colors flex items-center gap-1"
                    >
                      <span>Lihat Detail</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>

                    {!isStrava && (
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="text-zinc-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Hapus aktivitas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-zinc-400 block font-semibold">Durasi</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums font-mono text-sm">
                      {formatDuration(item.durationSec)}
                    </span>
                  </div>

                  {item.distanceMeters !== undefined && item.distanceMeters !== null && (
                    <div>
                      <span className="text-[10px] uppercase font-mono text-zinc-400 block font-semibold">Jarak</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums font-mono text-sm">
                        {formatDistance(item.distanceMeters)}
                      </span>
                    </div>
                  )}

                  {item.avgPaceSecPerKm && (
                    <div>
                      <span className="text-[10px] uppercase font-mono text-zinc-400 block font-semibold">Pace Rata-rata</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums font-mono text-sm">
                        {formatPace(item.avgPaceSecPerKm)}
                      </span>
                    </div>
                  )}

                  {item.calories && (
                    <div>
                      <span className="text-[10px] uppercase font-mono text-zinc-400 block font-semibold">Kalori</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums font-mono text-sm">
                        {item.calories} <span className="text-xs font-normal text-zinc-500">kkal</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Gym Sets detail tags */}
                {sets && sets.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5 font-mono">
                      Rincian Gerakan Latihan Beban ({sets.length} gerakan)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {sets.map((set, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[11px] bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 font-mono"
                        >
                          {set.exercise}: <strong>{set.sets}x{set.reps}</strong> @ {set.weightKg}kg
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Athlete notes */}
                {item.notes && (
                  <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/80">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase font-semibold block mb-0.5">Catatan Sesi</span>
                    <p>{item.notes}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. Pagination Controls */}
      <Pagination
        currentPage={validPage}
        totalPages={calculatedTotalPages}
        onPageChange={handlePageChange}
        totalItems={filteredActivities.length}
        itemsPerPage={itemsPerPage}
      />

      {/* 6. Quick Action Modals */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Catat Aktivitas Latihan"
        description="Pilih jenis olahraga lari atau gym untuk mencatat sesi latihan Anda"
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
        isOpen={isFoodModalOpen}
        onClose={() => setIsFoodModalOpen(false)}
        title="AI Food Scanner (Multimodal)"
        description="Unggah foto makanan untuk ekstraksi nutrisi & kalori instan dengan Gemini Vision"
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
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        title="Catat Berat Badan"
        description="Catat penimbangan berat badan untuk melacak tren massa tubuh"
        maxWidth="sm"
      >
        <LogWeightModalForm
          onSuccess={() => {
            setIsWeightModalOpen(false);
            startTransition(() => router.refresh());
          }}
        />
      </Modal>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        onOpenActivityModal={() => setIsActivityModalOpen(true)}
        onOpenFoodModal={() => setIsFoodModalOpen(true)}
        onOpenWeightModal={() => setIsWeightModalOpen(true)}
      />
    </div>
  );
}
