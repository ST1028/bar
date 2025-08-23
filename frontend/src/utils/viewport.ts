/**
 * Viewport Utilities for PWA Layout Consistency
 * iOS 16.4未満での dvh 未対応ブラウザ向けフォールバック
 */

/**
 * Visual Viewport APIを使用してdvhフォールバックを設定
 * iOS Safari古バージョンでの100vh問題を解決
 */
export function bindVisualViewport(): void {
  const updateViewportHeight = () => {
    // Visual Viewport APIが利用可能な場合
    const visualViewport = (window as any).visualViewport;
    const height = visualViewport ? visualViewport.height : window.innerHeight;
    
    // CSS変数として--app-dvhを設定
    document.documentElement.style.setProperty('--app-dvh', `${height}px`);
    
    // デバッグ用ログ（本番では削除可能）
    console.log(`📏 Viewport height updated: ${height}px`);
  };

  // 初回設定
  updateViewportHeight();

  // イベントリスナー設定
  window.addEventListener('resize', updateViewportHeight, { passive: true });
  window.addEventListener('orientationchange', updateViewportHeight, { passive: true });
  
  // Visual Viewport APIが利用可能な場合の追加リスナー
  const visualViewport = (window as any).visualViewport;
  if (visualViewport) {
    visualViewport.addEventListener('resize', updateViewportHeight, { passive: true });
  }
}

/**
 * PWA表示モード検出
 * @returns boolean PWAモードかどうか
 */
export function isPWAMode(): boolean {
  // CSS Media Query检测
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // iOS Safari PWA检测
  const isIOSStandalone = (window.navigator as any).standalone === true;
  
  // その他のPWAモード检测
  const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
  const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  
  return isStandalone || isIOSStandalone || isMinimalUI || isFullscreen;
}

/**
 * Safe Area Insets取得
 * @returns object Safe Area Insetsの値
 */
export function getSafeAreaInsets() {
  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    top: computedStyle.getPropertyValue('--safe-top') || '0px',
    right: computedStyle.getPropertyValue('--safe-right') || '0px',
    bottom: computedStyle.getPropertyValue('--safe-bottom') || '0px',
    left: computedStyle.getPropertyValue('--safe-left') || '0px',
  };
}

/**
 * レイアウト高さ取得
 * @returns object ヘッダーとボトムの高さ
 */
export function getLayoutHeights() {
  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    header: parseInt(computedStyle.getPropertyValue('--header-height')) || 44,
    bottom: parseInt(computedStyle.getPropertyValue('--bottom-height')) || 64,
  };
}

/**
 * デバッグ情報出力
 * 開発時の検証用
 */
export function debugViewport(): void {
  const pwaMode = isPWAMode();
  const safeArea = getSafeAreaInsets();
  const heights = getLayoutHeights();
  const viewportHeight = (window as any).visualViewport?.height || window.innerHeight;
  
  console.group('🔍 Viewport Debug Info');
  console.log('PWA Mode:', pwaMode);
  console.log('Screen:', `${screen.width}x${screen.height}`);
  console.log('Window:', `${window.innerWidth}x${window.innerHeight}`);
  console.log('Visual Viewport:', `${window.innerWidth}x${viewportHeight}`);
  console.log('Safe Area:', safeArea);
  console.log('Layout Heights:', heights);
  console.log('User Agent:', navigator.userAgent);
  console.groupEnd();
}