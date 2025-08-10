import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { AnimatePresence } from 'framer-motion';

import BottomNavigation from './BottomNavigation';
import OrderPage from '../pages/OrderPage';
import PatronPage from '../pages/PatronPage';
import HistoryPage from '../pages/HistoryPage';
import AdminPage from '../pages/AdminPage';
import TopBar from './TopBar';

const AuthenticatedApp = () => {
  return (
    <Box sx={{ pb: 8 }}>
      <TopBar />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<OrderPage />} />
          <Route path="/patrons" element={<PatronPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </AnimatePresence>
      <BottomNavigation />
    </Box>
  );
};

export default AuthenticatedApp;