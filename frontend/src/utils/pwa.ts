/**
 * Check if the app is running as a PWA (installed app)
 * @returns boolean - true if running as PWA
 */
export const isPWA = (): boolean => {
  // Check if app is in standalone mode (added to home screen)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Check for iOS standalone mode
  const isIOSStandalone = (window.navigator as any).standalone === true;
  
  // Check for Android PWA
  const isAndroidPWA = window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches;
  
  return isStandalone || isIOSStandalone || isAndroidPWA;
};

/**
 * Check if the app is running in a mobile browser (not PWA)
 * @returns boolean - true if running in mobile browser
 */
export const isMobileBrowser = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for mobile devices
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  return isMobile && !isPWA();
};

/**
 * Get the appropriate navigation height based on the environment
 * @returns number - height in pixels
 */
export const getNavigationHeight = (): number => {
  if (isPWA()) {
    return 44; // Same as TopBar for PWA
  }
  return 64; // Default browser height
};

/**
 * Get CSS safe area insets for PWA
 * @returns object with safe area values
 */
export const getSafeAreaInsets = () => {
  if (isPWA()) {
    return {
      top: 'env(safe-area-inset-top, 0px)',
      bottom: 'env(safe-area-inset-bottom, 0px)',
      left: 'env(safe-area-inset-left, 0px)',
      right: 'env(safe-area-inset-right, 0px)'
    };
  }
  return {
    top: '0px',
    bottom: '0px', 
    left: '0px',
    right: '0px'
  };
};