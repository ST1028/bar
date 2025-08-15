import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
  Slide,
} from '@mui/material';
import { Close, GetApp } from '@mui/icons-material';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Don't show prompt if already installed or dismissed recently
      const lastDismissed = localStorage.getItem('pwa-install-dismissed');
      const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
      
      if (!standalone && (!lastDismissed || parseInt(lastDismissed) < threeDaysAgo)) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show install prompt after some time if not already standalone
    if (iOS && !standalone) {
      const hasShownIOSPrompt = localStorage.getItem('ios-install-prompt-shown');
      if (!hasShownIOSPrompt) {
        setTimeout(() => {
          setShowInstallPrompt(true);
          localStorage.setItem('ios-install-prompt-shown', 'true');
        }, 5000); // Show after 5 seconds
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installed');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  return (
    <Slide direction="up" in={showInstallPrompt} mountOnEnter unmountOnExit>
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          bottom: { xs: 80, sm: 20 },
          left: { xs: 16, sm: 20 },
          right: { xs: 16, sm: 'auto' },
          maxWidth: { xs: 'auto', sm: 400 },
          p: 2,
          zIndex: 1300,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'primary.main',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <GetApp color="primary" sx={{ mt: 0.5 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              アプリをインストール
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {isIOS 
                ? 'ホーム画面に追加してアプリのように使用できます。Safariの共有ボタンから「ホーム画面に追加」を選択してください。'
                : 'ホーム画面に追加して、より快適にご利用いただけます。'
              }
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button size="small" onClick={handleDismiss}>
                後で
              </Button>
              {!isIOS && deferredPrompt && (
                <Button 
                  variant="contained" 
                  size="small" 
                  onClick={handleInstallClick}
                  startIcon={<GetApp />}
                >
                  インストール
                </Button>
              )}
            </Box>
          </Box>
          <IconButton 
            size="small" 
            onClick={handleDismiss}
            sx={{ ml: 1 }}
          >
            <Close />
          </IconButton>
        </Box>
      </Paper>
    </Slide>
  );
};

export default PWAInstallPrompt;