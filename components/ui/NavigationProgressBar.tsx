'use client';

import React, { useEffect, useState, useTransition, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function NavigationProgressBarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // When path or search parameters finish changing, complete the progress bar
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsNavigating(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isNavigating) {
      setIsVisible(true);
      setProgress((prev) => (prev === 0 ? 25 : prev));
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) return prev;
          return prev + Math.floor(Math.random() * 10 + 5);
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isNavigating]);

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      // Skip non-navigation, external, or hash-only links
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        target.target === '_blank' ||
        target.hasAttribute('download')
      ) {
        return;
      }

      // If internal navigation link
      try {
        const url = new URL(href, window.location.href);
        const currentUrl = new URL(window.location.href);

        const isSameOrigin = url.origin === currentUrl.origin;
        const isDifferentRoute =
          url.pathname !== currentUrl.pathname || url.search !== currentUrl.search;

        if (isSameOrigin && isDifferentRoute) {
          setIsNavigating(true);
          setProgress(30);
        }
      } catch {
        // Ignore invalid URL
      }
    };

    document.addEventListener('click', handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none transition-opacity duration-300"
      style={{ opacity: isVisible ? 1 : 0 }}
      aria-hidden="true"
    >
      <div
        className="h-full bg-[#FC5200] shadow-[0_0_8px_#FC5200] transition-all ease-out duration-200"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBarContent />
    </Suspense>
  );
}
