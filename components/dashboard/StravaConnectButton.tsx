'use client';

import React, { useState } from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';

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
        setMessage(data.message || 'Sinkronisasi berhasil.');
        if (onSyncComplete) onSyncComplete();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal sinkronisasi';
      setMessage(errMsg);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-8 h-8 rounded-md bg-[#FC5200] text-white flex items-center justify-center font-bold text-sm shrink-0">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Strava Integration
              </h3>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center text-[11px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  Not Connected
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {isConnected
                ? `Athlete #${athleteId || '-'} • Token di-refresh otomatis sebelum expire`
                : 'Hubungkan untuk menyinkronkan aktivitas GPS, jarak, dan rute lari/sepeda secara otomatis'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="text-xs font-medium px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Tarik Data'}</span>
            </button>
          ) : (
            <a
              href="/api/auth/strava"
              className="text-xs font-medium px-3.5 py-1.5 rounded-md bg-[#FC5200] hover:bg-[#e04302] text-white flex items-center gap-1.5 transition-colors"
            >
              <span>Connect Strava</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {message && (
        <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 rounded border border-zinc-200 dark:border-zinc-800">
          {message}
        </div>
      )}
    </div>
  );
}
