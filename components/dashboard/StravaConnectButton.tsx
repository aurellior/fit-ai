'use client';

import React, { useState } from 'react';
import { RefreshCw, ExternalLink, Check } from 'lucide-react';

interface StravaConnectButtonProps {
  isConnected: boolean;
  athleteId?: string | null;
  onSyncComplete?: () => void;
}

export default function StravaConnectButton({
  isConnected,
  onSyncComplete,
}: StravaConnectButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    setIsSuccess(false);
    try {
      const res = await fetch('/api/strava/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        if (onSyncComplete) onSyncComplete();
        setTimeout(() => setIsSuccess(false), 2500);
      }
    } catch {
      // Keep quiet on error or handled by state
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isConnected) {
    return (
      <a
        href="/api/auth/strava"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FC5200] hover:bg-[#E04900] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
      >
        <span>Connect Strava</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/80 border border-zinc-200/80 dark:border-zinc-700/80 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors disabled:opacity-50 cursor-pointer active:scale-95 shrink-0"
      title="Tarik data aktivitas terbaru dari Strava"
    >
      {isSuccess ? (
        <Check className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <RefreshCw className={`w-3.5 h-3.5 text-[#FC5200] ${isSyncing ? 'animate-spin' : ''}`} />
      )}
      <span>{isSyncing ? 'Syncing...' : isSuccess ? 'Tersinkron' : 'Sync Strava'}</span>
    </button>
  );
}
