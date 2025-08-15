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

  // Debug: Log category data
  useEffect(() => {
    if (categories) {
      console.log('Categories data:', categories);
      categories.forEach(category => {
        console.log(`Category: ${category.name}, imageUrl: ${category.imageUrl}`);
      });
    }
  }, [categories]);

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
              {(category.items?.length || 0) > 0 && (
                <>
                  <Box sx={{ mb: 3, mt: 4 }}>
                    {category.imageUrl && category.imageUrl.trim() && (
                      <Box 
                        sx={{ 
                          position: 'relative', 
                          borderRadius: 3, 
                          overflow: 'hidden', 
                          mb: 3,
                          height: 240,
                          background: `linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%), url(${category.imageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid',
                          borderColor: 'primary.main',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                            borderColor: 'primary.light',
                          }
                        }}
                      >
                        {/* Glass overlay effect */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.1) 100%)',
                          }}
                        />
                        
                        <Box sx={{ position: 'relative', textAlign: 'center', zIndex: 2 }}>
                          <Typography
                            variant="h3"
                            sx={{
                              color: 'white',
                              fontWeight: 800,
                              textAlign: 'center',
                              textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
                              letterSpacing: '0.5px',
                              mb: 1
                            }}
                          >
                            {category.name}
                          </Typography>
                          {category.description && (
                            <Typography
                              variant="subtitle1"
                              sx={{
                                color: 'rgba(255,255,255,0.9)',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                                fontWeight: 500,
                                maxWidth: 300,
                                mx: 'auto'
                              }}
                            >
                              {category.description}
                            </Typography>
                          )}
                        </Box>
                        
                        {/* Decorative corner elements */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
                            backdropFilter: 'blur(10px)',
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 16,
                            left: 16,
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
                            backdropFilter: 'blur(10px)',
                          }}
                        />
                      </Box>
                    )}
                    {!category.imageUrl && (
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
                    )}
                  </Box>
                  
                  {category.items?.map((item) => (
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