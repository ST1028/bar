import { useState, useEffect } from 'react';
import { Box, Container, Fab, Badge } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

import { menuAPI, patronAPI } from '../services/api';
import { useCartStore } from '../stores/cart';
import MenuCategoryList from '../components/order/MenuCategoryList';
import CartDrawer from '../components/order/CartDrawer';
import PatronSelector from '../components/order/PatronSelector';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorMessage from '../components/ErrorMessage';

const OrderPage = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const [patronSelectorOpen, setPatronSelectorOpen] = useState(false);
  const { getItemCount, selectedPatronId } = useCartStore();

  const { data: categories, isLoading: menusLoading, error: menusError } = useQuery({
    queryKey: ['menus'],
    queryFn: menuAPI.getMenus,
  });

  const { data: patrons, isLoading: patronsLoading } = useQuery({
    queryKey: ['patrons'],
    queryFn: patronAPI.getPatrons,
  });

  useEffect(() => {
    if (!selectedPatronId && patrons && patrons.length > 0 && getItemCount() > 0) {
      setPatronSelectorOpen(true);
    }
  }, [selectedPatronId, patrons, getItemCount]);

  if (menusLoading || patronsLoading) {
    return <LoadingSkeleton />;
  }

  if (menusError) {
    return <ErrorMessage message="メニューの読み込みに失敗しました" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ mt: 8, mb: 2 }}>
        <Container maxWidth="lg">
          <MenuCategoryList categories={categories || []} />
        </Container>
      </Box>

      <AnimatePresence>
        {getItemCount() > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Fab
              color="primary"
              aria-label="cart"
              sx={{
                position: 'fixed',
                bottom: 80,
                right: 16,
                zIndex: 1000,
              }}
              onClick={() => setCartOpen(true)}
            >
              <Badge badgeContent={getItemCount()} color="error">
                <ShoppingCart />
              </Badge>
            </Fab>
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onPatronSelect={() => setPatronSelectorOpen(true)}
      />

      <PatronSelector
        open={patronSelectorOpen}
        onClose={() => setPatronSelectorOpen(false)}
        patrons={patrons || []}
      />
    </motion.div>
  );
};

export default OrderPage;