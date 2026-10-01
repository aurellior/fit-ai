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
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-3 sm:p-4 overflow-hidden pointer-events-auto isolate">
      {/* Backdrop: Mencegah touchmove agar layar belakang tidak bisa di-scroll di mobile */}
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/80 sm:backdrop-blur-sm transition-opacity"
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
        aria-hidden="true"
      />

      {/* Dialog Body: floating card dengan margin horizontal bersih & safe area iOS */}
      <div
        className={`relative w-full max-w-full ${maxWidthClass} mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-xl shadow-2xl z-10 p-4 sm:p-6 pb-[max(1.5rem,calc(0.75rem+env(safe-area-inset-bottom)))] mb-[max(0.5rem,env(safe-area-inset-bottom))] sm:mb-0 max-h-[85dvh] sm:max-h-[90vh] flex flex-col overscroll-contain animate-in slide-in-from-bottom duration-200 overflow-hidden`}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Swipe / Sheet Handle */}
        <div className="sm:hidden w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-3 shrink-0" />

        <div className="flex items-start justify-between gap-3 mb-3.5 pb-2.5 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <div className="min-w-0 pr-2">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
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
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors -mr-1 -mt-1 cursor-pointer shrink-0"
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


