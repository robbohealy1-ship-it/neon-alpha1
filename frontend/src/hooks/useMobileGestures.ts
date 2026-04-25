import { useEffect, useRef, useCallback, useState } from 'react';

interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
}

interface UseMobileGesturesOptions {
  threshold?: number;
  preventDefault?: boolean;
  longPressDelay?: number;
}

export function useMobileGestures(
  elementRef: React.RefObject<HTMLElement>,
  callbacks: SwipeCallbacks,
  options: UseMobileGesturesOptions = {}
) {
  const { 
    threshold = 50, 
    preventDefault = true,
    longPressDelay = 500 
  } = options;
  
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const lastTap = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    isLongPress.current = false;
    
    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      callbacks.onLongPress?.();
    }, longPressDelay);
  }, [callbacks, longPressDelay]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }
    
    // Cancel long press if moved
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, [preventDefault]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // Don't process if it was a long press
    if (isLongPress.current) {
      return;
    }
    
    const touch = e.changedTouches[0];
    const start = touchStart.current;
    
    if (!start) return;
    
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const deltaTime = Date.now() - start.time;
    
    // Check for double tap
    const now = Date.now();
    if (now - lastTap.current < 300) {
      callbacks.onDoubleTap?.();
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
    
    // Single tap (if minimal movement)
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
      callbacks.onTap?.();
      return;
    }
    
    // Swipe detection
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX > absY && absX > threshold) {
      // Horizontal swipe
      if (deltaX > 0) {
        callbacks.onSwipeRight?.();
      } else {
        callbacks.onSwipeLeft?.();
      }
    } else if (absY > absX && absY > threshold) {
      // Vertical swipe
      if (deltaY > 0) {
        callbacks.onSwipeDown?.();
      } else {
        callbacks.onSwipeUp?.();
      }
    }
    
    touchStart.current = null;
  }, [callbacks, threshold]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault]);
}

// Hook for pull-to-refresh
export function usePullToRefresh(
  elementRef: React.RefObject<HTMLElement>,
  onRefresh: () => Promise<void>,
  options: { threshold?: number } = {}
) {
  const { threshold = 80 } = options;
  const pullStart = useRef<number | null>(null);
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop === 0) {
        pullStart.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (pullStart.current === null) return;
      
      const delta = e.touches[0].clientY - pullStart.current;
      if (delta > 0) {
        e.preventDefault();
        const progress = Math.min(delta / threshold, 1);
        setPullProgress(progress);
      }
    };

    const handleTouchEnd = async () => {
      if (pullProgress >= 1 && !isRefreshing) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }
      pullStart.current = null;
      setPullProgress(0);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, onRefresh, threshold, pullProgress, isRefreshing]);

  return { pullProgress, isRefreshing };
}

// Hook for viewport detection with safe areas
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
    safeAreaTop: 0,
    safeAreaBottom: 0,
    safeAreaLeft: 0,
    safeAreaRight: 0,
  });

  useEffect(() => {
    const updateViewport = () => {
      // Check for safe area insets (iPhone X+, Android with display cutouts)
      const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0');
      const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0');
      const safeAreaLeft = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sal') || '0');
      const safeAreaRight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sar') || '0');

      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
        isDesktop: window.innerWidth >= 1024,
        safeAreaTop,
        safeAreaBottom,
        safeAreaLeft,
        safeAreaRight,
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  return viewport;
}

// Hook for keyboard visibility detection
export function useKeyboard() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const visualViewport = window.visualViewport;
      if (visualViewport) {
        const heightDiff = window.innerHeight - visualViewport.height;
        setIsKeyboardVisible(heightDiff > 150);
        setKeyboardHeight(heightDiff);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }
  }, []);

  return { isKeyboardVisible, keyboardHeight };
}

// Hook for PWA install prompt
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return { isInstallable, promptInstall };
}
