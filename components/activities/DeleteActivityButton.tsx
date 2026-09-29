'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteActivity } from '@/actions/activity';

interface DeleteActivityButtonProps {
  activityId: string;
}

export default function DeleteActivityButton({ activityId }: DeleteActivityButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm('Yakin ingin menghapus sesi aktivitas ini? Tindakan ini tidak dapat dibatalkan.')) {
      setIsDeleting(true);
      try {
        await deleteActivity(activityId);
        router.push('/activities');
        router.refresh();
      } catch (err) {
        console.error('Failed to delete activity:', err);
        setIsDeleting(false);
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-xs font-medium px-3 py-1.5 rounded-md border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center gap-1.5 disabled:opacity-50"
      title="Hapus aktivitas"
    >
      {isDeleting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
      <span>Hapus</span>
    </button>
  );
}
