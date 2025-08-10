import { BottomNavigation as MuiBottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Restaurant, People, History, AdminPanelSettings } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/auth';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const isAdmin = user?.groups?.includes('admin') || user?.email === 'admin@example.com';

  const getValueFromPath = (pathname: string): number => {
    switch (pathname) {
      case '/':
        return 0;
      case '/patrons':
        return 1;
      case '/history':
        return 2;
      case '/admin':
        return 3;
      default:
        return 0;
    }
  };

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    const basePaths = ['/', '/patrons', '/history'];
    const paths = isAdmin ? [...basePaths, '/admin'] : basePaths;
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
      }}
      elevation={8}
    >
      <MuiBottomNavigation
        value={getValueFromPath(location.pathname)}
        onChange={handleChange}
        showLabels
        sx={{
          height: 64,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            maxWidth: 'none',
          },
        }}
      >
        <BottomNavigationAction
          label="Order"
          icon={<Restaurant />}
          sx={{ color: 'primary.main' }}
        />
        <BottomNavigationAction
          label="Patrons"
          icon={<People />}
          sx={{ color: 'primary.main' }}
        />
        <BottomNavigationAction
          label="History"
          icon={<History />}
          sx={{ color: 'primary.main' }}
        />
        {isAdmin && (
          <BottomNavigationAction
            label="Admin"
            icon={<AdminPanelSettings />}
            sx={{ color: 'primary.main' }}
          />
        )}
      </MuiBottomNavigation>
    </Paper>
  );
};

export default BottomNavigation;