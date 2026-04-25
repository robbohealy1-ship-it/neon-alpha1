import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export type Platform = 'web' | 'ios' | 'android' | 'pwa';

export function usePlatform(): { 
  platform: Platform; 
  isNative: boolean; 
  isWeb: boolean;
  isPWA: boolean;
  isIOS: boolean;
  isAndroid: boolean;
} {
  const [platform, setPlatform] = useState<Platform>('web');
  const [pwaMode, setPwaMode] = useState(false);

  useEffect(() => {
    // Check if running in Capacitor native app
    const isNativePlatform = Capacitor.isNativePlatform();
    const nativePlatform = Capacitor.getPlatform(); // 'ios', 'android', or 'web'
    
    // Check if running as PWA (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSPWA = (window.navigator as any).standalone === true;
    const isPWA = isStandalone || isIOSPWA;
    
    setPwaMode(isPWA);

    if (isNativePlatform && nativePlatform !== 'web') {
      setPlatform(nativePlatform as Platform);
    } else if (pwaMode) {
      setPlatform('pwa');
    } else {
      setPlatform('web');
    }
  }, []);

  return {
    platform,
    isNative: platform === 'ios' || platform === 'android',
    isWeb: platform === 'web',
    isPWA: platform === 'pwa',
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
  };
}

// Hook for platform-specific haptic feedback
export function useHaptics() {
  const { isNative } = usePlatform();
  
  const trigger = async (type: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
    if (!isNative) return;
    
    try {
      // Dynamic import to avoid web build issues
      const { Haptics } = await import('@capacitor/haptics');
      
      switch (type) {
        case 'light':
        case 'medium':
        case 'heavy':
          await Haptics.impact({ style: type.toUpperCase() as any });
          break;
        case 'success':
          await Haptics.notification({ type: 'success' as any });
          break;
        case 'error':
          await Haptics.notification({ type: 'error' as any });
          break;
      }
    } catch (e) {
      // Haptics not available
    }
  };
  
  return { trigger };
}

// Hook for platform-specific safe areas
export function useSafeArea() {
  const [insets, setInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const updateInsets = async () => {
      try {
        // Try to get native safe area
        if (Capacitor.isNativePlatform()) {
          // Use CSS env variables as fallback
          const style = getComputedStyle(document.documentElement);
          setInsets({
            top: parseInt(style.getPropertyValue('--safe-area-top') || '0'),
            bottom: parseInt(style.getPropertyValue('--safe-area-bottom') || '0'),
            left: parseInt(style.getPropertyValue('--safe-area-left') || '0'),
            right: parseInt(style.getPropertyValue('--safe-area-right') || '0'),
          });
        }
      } catch (e) {
        // Use env() CSS variables
      }
    };
    
    updateInsets();
  }, []);

  return insets;
}
