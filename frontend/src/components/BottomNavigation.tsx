import { useRef } from 'react';
import { BottomNavigation as MuiBottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Player } from '@lordicon/react';
import { useAuthStore } from '../stores/auth';

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

  const isAdmin = user?.groups?.includes('admin') || user?.email === 'admin@example.com';

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
      className="app-bottom"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 'var(--z-bottom)',
        paddingBottom: 'var(--safe-bottom)',
        paddingLeft: 'var(--safe-left)',
        paddingRight: 'var(--safe-right)',
        background: 'var(--bottom-bg)',
        boxShadow: 'var(--elevation-bottom)',
      }}
      elevation={0}
    >
      <MuiBottomNavigation
        value={getValueFromPath(location.pathname)}
        onChange={handleChange}
        showLabels
        sx={{
          height: 'var(--bottom-height)',
          minHeight: 'var(--bottom-height)',
          backgroundColor: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            maxWidth: 'none',
            fontSize: '0.875rem',
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              marginTop: '4px',
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
              size={24}
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
              size={24}
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
              size={24}
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
                size={24}
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