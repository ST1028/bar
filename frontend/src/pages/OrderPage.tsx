import { useState, useEffect, useRef } from 'react';
import { Box, Container, Fab, Badge, Typography, Divider, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '@lordicon/react';

import { menuAPI, patronAPI } from '../services/api';
import { useCartStore } from '../stores/cart';
import MenuItemCard from '../components/order/MenuItemCard';
import CartDrawer from '../components/order/CartDrawer';
import PatronSelector from '../components/order/PatronSelector';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorMessage from '../components/ErrorMessage';

import cartIconAnimation from '../icons/wired-outline-146-trolley-hover-jump.json';
import ConfettiAnimation from '../components/ConfettiAnimation';

const OrderPage = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const [patronSelectorOpen, setPatronSelectorOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const cartIconRef = useRef<Player>(null);
  const { getItemCount, setOnItemAdded } = useCartStore();

  // Set up cart animation callback
  useEffect(() => {
    const handleItemAdded = () => {
      if (cartIconRef.current) {
        cartIconRef.current.playFromBeginning();
      }
    };
    
    setOnItemAdded(handleItemAdded);
    
    // Clean up
    return () => {
      setOnItemAdded(() => {});
    };
  }, [setOnItemAdded]);

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

  // Removed automatic patron selector opening to allow manual selection

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
              textAlign: 'center'
            }}>
              Menu
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
                            {category.nameEn || category.name}
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
                        label={category.nameEn || category.name}
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

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
      >
        <Fab
          color="primary"
          aria-label="cart"
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            zIndex: 1000
          }}
          onClick={() => setCartOpen(true)}
        >
          <Badge badgeContent={getItemCount() > 0 ? getItemCount() : undefined} color="error">
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, -10, 10, 0]
              }}
              transition={{
                duration: 0.6,
                ease: "easeInOut"
              }}
              key={getItemCount()}
            >
              <Player
                ref={cartIconRef}
                icon={cartIconAnimation}
                size={24}
                colorize="#ffffff"
              />
            </motion.div>
          </Badge>
        </Fab>
      </motion.div>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onPatronSelect={() => setPatronSelectorOpen(true)}
        onOrderSuccess={() => setShowConfetti(true)}
      />

      <PatronSelector
        open={patronSelectorOpen}
        onClose={() => setPatronSelectorOpen(false)}
        patrons={patrons || []}
      />
      
      <ConfettiAnimation 
        open={showConfetti} 
        onClose={() => setShowConfetti(false)} 
      />
    </motion.div>
  );
};

export default OrderPage;