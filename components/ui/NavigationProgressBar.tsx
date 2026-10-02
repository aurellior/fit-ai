'use client';

import React, { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function NavigationProgressBarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const currentUrl = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
  const activeUrlRef = useRef(currentUrl);

  const startProgress = useCallback(() => {
    setIsVisible(true);
    setIsNavigating(true);
    setProgress((prev) => (prev > 0 ? prev : 25));
  }, []);

  const completeProgress = useCallback(() => {
    setProgress(100);
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setIsNavigating(false);
      setProgress(0);
    }, 280);
    return () => clearTimeout(hideTimer);
  }, []);

  // When pathname or searchParams change, mark navigation complete
  useEffect(() => {
    if (activeUrlRef.current !== currentUrl) {
      activeUrlRef.current = currentUrl;
      if (isNavigating) {
        const timer = setTimeout(() => {
          completeProgress();
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUrl, isNavigating, completeProgress]);

  // Trickle progression while waiting for server / route render
  useEffect(() => {
    if (!isNavigating) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) return prev;
        // Asymptotic trickle: slower as it gets closer to 88%
        const diff = 88 - prev;
        const step = Math.max(1, Math.floor(diff * 0.25));
        return prev + step;
      });
    }, 120);

    // Safety timeout in case navigation stalls or is aborted
    const timeout = setTimeout(() => {
      if (isNavigating) {
        completeProgress();
      }
    }, 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isNavigating, completeProgress]);

  // Intercept click on internal links
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
        href.startsWith('javascript:') ||
        target.target === '_blank' ||
        target.hasAttribute('download')
      ) {
        return;
      }

      try {
        const url = new URL(href, window.location.href);
        const currentLoc = new URL(window.location.href);

        const isSameOrigin = url.origin === currentLoc.origin;
        const isDifferentRoute =
          url.pathname !== currentLoc.pathname || url.search !== currentLoc.search;

        if (isSameOrigin && isDifferentRoute) {
          startProgress();
        }
      } catch {
        // Ignore invalid URL parsing
      }
    };

    const handlePopState = () => {
      startProgress();
    };

    document.addEventListener('click', handleDocumentClick, { capture: true });
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
      window.removeEventListener('popstate', handlePopState);
    };
  }, [startProgress]);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      className={`fixed left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-[9999] pointer-events-none transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        top: 'env(safe-area-inset-top, 0px)',
      }}
      aria-hidden="true"
    >
      <div className="relative w-full h-[2.5px] bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-[#FC5200] via-[#FF7A00] to-[#FFB700] shadow-[0_0_12px_rgba(252,82,0,0.9),0_0_4px_rgba(255,183,0,0.8)] transition-all ease-out duration-150 relative rounded-r-full"
          style={{ width: `${progress}%` }}
        >
          {/* Subtle glow spark on the leading edge */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#FC5200] blur-xs opacity-80 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/40 pointer-events-none" />
        </div>
      </div>
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
