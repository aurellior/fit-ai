'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const emptySubscribe = () => () => {};

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}: ModalProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Kunci scroll body dengan pencegahan layout shift & ref-counting
  useBodyScrollLock(isOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !isClient) return null;

  const maxWidthClass = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
  }[maxWidth];

  const modalContent = (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 overflow-hidden pointer-events-auto isolate">
      {/* Backdrop: Mencegah touchmove agar layar belakang tidak bisa di-scroll di mobile */}
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
        aria-hidden="true"
      />

      {/* Dialog Body: Native bottom-sheet style with rounded-t-3xl on mobile and safe area iOS */}
      <div
        className={`relative w-full max-w-full sm:${maxWidthClass} max-w-md mx-auto bg-white dark:bg-[#121214] border-t sm:border border-zinc-200 dark:border-zinc-800/90 rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 p-4 sm:p-6 pb-[max(1.75rem,calc(1rem+env(safe-area-inset-bottom)))] mb-0 max-h-[88dvh] sm:max-h-[90vh] flex flex-col overscroll-contain animate-in slide-in-from-bottom duration-200 overflow-hidden`}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Swipe / Sheet Handle */}
        <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-3 shrink-0" />

        <div className="flex items-start justify-between gap-3 mb-3.5 pb-2.5 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <div className="min-w-0 pr-2">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 active:scale-90 transition-transform cursor-pointer shrink-0"
            aria-label="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain pr-1 flex-1">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}


