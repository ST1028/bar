import { BottomNavigation as MuiBottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Restaurant, People, History } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getValueFromPath = (pathname: string): number => {
    switch (pathname) {
      case '/':
        return 0;
      case '/patrons':
        return 1;
      case '/history':
        return 2;
      default:
        return 0;
    }
  };

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    const paths = ['/', '/patrons', '/history'];
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
          label="注文"
          icon={<Restaurant />}
          sx={{ color: 'primary.main' }}
        />
        <BottomNavigationAction
          label="注文者管理"
          icon={<People />}
          sx={{ color: 'primary.main' }}
        />
        <BottomNavigationAction
          label="履歴"
          icon={<History />}
          sx={{ color: 'primary.main' }}
        />
      </MuiBottomNavigation>
    </Paper>
  );
};

export default BottomNavigation;