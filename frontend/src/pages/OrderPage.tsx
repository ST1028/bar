import { useState, useEffect } from 'react';
import { Box, Container, Fab, Badge, Typography, Divider, Chip } from '@mui/material';
import { ShoppingCart, LocalBar } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

import { menuAPI, patronAPI } from '../services/api';
import { useCartStore } from '../stores/cart';
import MenuItemCard from '../components/order/MenuItemCard';
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
      <Box sx={{ pt: 8, pb: 10 }}>
        <Container maxWidth="md" sx={{ px: 2 }}>
          {/* Header */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ 
              fontWeight: 700, 
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}>
              <LocalBar /> Menu
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Tap to add items to your order
            </Typography>
          </Box>

          {/* Menu Items */}
          {categories && categories.map((category) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {category.items.length > 0 && (
                <>
                  <Box sx={{ mb: 3, mt: 4 }}>
                    <Chip
                      label={category.name}
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        height: 40,
                        px: 2,
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        }
                      }}
                    />
                  </Box>
                  
                  {category.items.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                  
                  <Divider sx={{ my: 2, bgcolor: 'divider' }} />
                </>
              )}
            </motion.div>
          ))}
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
                width: 64,
                height: 64
              }}
              onClick={() => setCartOpen(true)}
            >
              <Badge badgeContent={getItemCount()} color="error">
                <ShoppingCart sx={{ fontSize: '1.5rem' }} />
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