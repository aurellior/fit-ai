'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Body (Bottom sheet on mobile, centered modal on sm+) */}
      <div
        className={`relative w-full ${maxWidthClass} bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 rounded-t-2xl sm:rounded-lg shadow-2xl z-10 p-5 sm:p-6 my-0 sm:my-8 max-sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200`}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Swipe / Sheet Handle */}
        <div className="sm:hidden w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-3 shrink-0" />

        <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors -mr-1 -mt-1"
            aria-label="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
