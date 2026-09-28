'use client';

import React, { useState } from 'react';
import { RefreshCw, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react';

interface StravaConnectButtonProps {
  isConnected: boolean;
  athleteId?: string | null;
  onSyncComplete?: () => void;
}

export default function StravaConnectButton({
  isConnected,
  athleteId,
  onSyncComplete,
}: StravaConnectButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/strava/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message || 'Sinkronisasi berhasil!');
        if (onSyncComplete) onSyncComplete();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kegagalan sinkronisasi';
      setMessage(`Gagal: ${errMsg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FC4C02] text-white flex items-center justify-center font-black text-lg shadow-md shadow-orange-500/30">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white">Integrasi Strava API</h3>
              {isConnected ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Terhubung
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" /> Belum Terhubung
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isConnected
                ? `Atlet ID: ${athleteId || '-'} • Token otomatis diperbarui saat kedaluwarsa`
                : 'Sinkronisasi aktivitas lari dan bersepeda langsung dari perangkat Anda'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-4 py-2 bg-[#FC4C02] hover:bg-[#e04302] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Tarik Data Terbaru'}</span>
            </button>
          ) : (
            <a
              href="/api/auth/strava"
              className="px-4 py-2 bg-[#FC4C02] hover:bg-[#e04302] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <span>Hubungkan Akun</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {message && (
        <div className="mt-3 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-800/60 p-2 rounded-lg border border-orange-500/10">
          {message}
        </div>
      )}
    </div>
  );
}
