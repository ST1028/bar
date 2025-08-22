import { useRef, useState, useEffect } from 'react';
import { BottomNavigation as MuiBottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Player } from '@lordicon/react';
import { useAuthStore } from '../stores/auth';
import { getNavigationHeight, getSafeAreaInsets } from '../utils/pwa';

import orderAnimationBold from '../icons/wired-outline-502-two-glasses-pint-beer-hover-pinch-bold.json';
import patronAnimationBold from '../icons/wired-outline-313-two-avatar-icon-calm-hover-jumping-bold.json';
import historyAnimationBold from '../icons/wired-outline-1334-order-history-hover-pinch-bold.json';
import adminAnimationBold from '../icons/wired-outline-1004-management-team-hover-smooth-bold.json';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const orderIconBoldRef = useRef<Player>(null);
  const patronIconBoldRef = useRef<Player>(null);
  const historyIconBoldRef = useRef<Player>(null);
  const adminIconBoldRef = useRef<Player>(null);
  
  const [navigationHeight, setNavigationHeight] = useState(getNavigationHeight());
  const [safeAreaInsets, setSafeAreaInsets] = useState(getSafeAreaInsets());

  const isAdmin = user?.groups?.includes('admin') || user?.email === 'admin@example.com';

  // Update height when display mode changes (PWA installation/uninstallation)
  useEffect(() => {
    const updateNavigationHeight = () => {
      setNavigationHeight(getNavigationHeight());
      setSafeAreaInsets(getSafeAreaInsets());
    };

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', updateNavigationHeight);

    // Listen for orientation changes which might affect PWA status
    window.addEventListener('orientationchange', updateNavigationHeight);
    window.addEventListener('resize', updateNavigationHeight);

    return () => {
      mediaQuery.removeEventListener('change', updateNavigationHeight);
      window.removeEventListener('orientationchange', updateNavigationHeight);
      window.removeEventListener('resize', updateNavigationHeight);
    };
  }, []);

  const getValueFromPath = (pathname: string): number => {
    if (pathname.startsWith('/patrons')) {
      return 1;
    } else if (pathname.startsWith('/history')) {
      return 2;
    } else if (pathname.startsWith('/admin')) {
      return 3;
    } else {
      // Default to Order (index 0) for root path and any other paths
      return 0;
    }
  };

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    const basePaths = ['/', '/patrons', '/history'];
    const paths = isAdmin ? [...basePaths, '/admin'] : basePaths;
    
    // Trigger animation for the selected tab
    switch (newValue) {
      case 0:
        orderIconBoldRef.current?.playFromBeginning();
        break;
      case 1:
        patronIconBoldRef.current?.playFromBeginning();
        break;
      case 2:
        historyIconBoldRef.current?.playFromBeginning();
        break;
      case 3:
        adminIconBoldRef.current?.playFromBeginning();
        break;
    }
    
    navigate(paths[newValue]);
  };

  return (
    <Paper
      component={motion.div}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        paddingBottom: safeAreaInsets.bottom,
      }}
      elevation={8}
    >
      <MuiBottomNavigation
        value={getValueFromPath(location.pathname)}
        onChange={handleChange}
        showLabels
        sx={{
          height: navigationHeight,
          minHeight: navigationHeight,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            maxWidth: 'none',
            fontSize: navigationHeight === 44 ? '0.75rem' : '0.875rem', // Smaller text for PWA
            '& .MuiBottomNavigationAction-label': {
              fontSize: navigationHeight === 44 ? '0.625rem' : '0.75rem', // Adjust label size
              marginTop: navigationHeight === 44 ? '2px' : '4px',
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Order"
          icon={
            <Player
              ref={orderIconBoldRef}
              icon={orderAnimationBold}
              size={navigationHeight === 44 ? 20 : 24}
              colorize={getValueFromPath(location.pathname) === 0 ? "#81C784" : "#666666"}
            />
          }
        />
        <BottomNavigationAction
          label="Patrons"
          icon={
            <Player
              ref={patronIconBoldRef}
              icon={patronAnimationBold}
              size={navigationHeight === 44 ? 20 : 24}
              colorize={getValueFromPath(location.pathname) === 1 ? "#81C784" : "#666666"}
            />
          }
        />
        <BottomNavigationAction
          label="History"
          icon={
            <Player
              ref={historyIconBoldRef}
              icon={historyAnimationBold}
              size={navigationHeight === 44 ? 20 : 24}
              colorize={getValueFromPath(location.pathname) === 2 ? "#81C784" : "#666666"}
            />
          }
        />
        {isAdmin && (
          <BottomNavigationAction
            label="Admin"
            icon={
              <Player
                ref={adminIconBoldRef}
                icon={adminAnimationBold}
                size={navigationHeight === 44 ? 20 : 24}
                colorize={getValueFromPath(location.pathname) === 3 ? "#81C784" : "#666666"}
              />
            }
          />
        )}
      </MuiBottomNavigation>
    </Paper>
  );
};

export default BottomNavigation;