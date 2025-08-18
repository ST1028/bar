import { useState, useEffect, useRef } from 'react';
import { Box, Container, Fab, Badge, Typography, IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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

  const selectedCategoryData = categories?.find(cat => cat.id === selectedCategory);

  return (
    <LayoutGroup>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ pt: 8, pb: 10 }}>
          <Container maxWidth="lg" sx={{ px: 2 }}>
            <AnimatePresence mode="wait">
              {!selectedCategory ? (
                <motion.div
                  key="categories"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Header */}
                  <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ 
                      fontWeight: 700, 
                      color: 'text.primary',
                      textAlign: 'center',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                    }}>
                      Menu
                    </Typography>
                  </Box>

                  {/* Category Grid */}
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr', md: '1fr 1fr' },
                    gap: 2,
                    mb: 4
                  }}>
                    {categories?.filter(category => (category.items?.length || 0) > 0).map((category, index) => (
                      <motion.div
                        key={category.id}
                        layoutId={`category-${category.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          duration: 0.4,
                          delay: index * 0.1
                        }}
                        whileHover={{ y: -8 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Box
                          onClick={() => setSelectedCategory(category.id)}
                          sx={{
                            position: 'relative',
                            borderRadius: 4,
                            overflow: 'hidden',
                            height: { xs: 280, sm: 320, md: 360 },
                            background: category.imageUrl 
                              ? `linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%), url(${category.imageUrl})`
                              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                              boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
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
                              backdropFilter: 'blur(1px)',
                            }}
                          />
                          
                          {/* Content */}
                          <Box sx={{ 
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            p: 3,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                            color: 'white'
                          }}>
                            <Typography
                              variant="h5"
                              sx={{
                                fontWeight: 700,
                                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
                                lineHeight: 1.2,
                                mb: 0.5
                              }}
                            >
{category.nameEn || category.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'rgba(255,255,255,0.8)',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                                fontWeight: 400
                              }}
                            >
                              {category.items?.length || 0} items
                            </Typography>
                          </Box>

                          {/* Item count badge */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 16,
                              right: 16,
                              bgcolor: 'rgba(255,255,255,0.9)',
                              color: 'text.primary',
                              px: 2,
                              py: 0.5,
                              borderRadius: 2,
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255,255,255,0.2)'
                            }}
                          >
                            {category.items?.length || 0}
                          </Box>
                        </Box>
                      </motion.div>
                    ))}
                  </Box>
                </motion.div>
              ) : (
                <motion.div
                  key="menu-detail"
                  layoutId={`category-${selectedCategory}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Back Button and Header */}
                  <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton
                      onClick={() => setSelectedCategory(null)}
                      sx={{ 
                        bgcolor: 'background.paper',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        '&:hover': {
                          bgcolor: 'grey.100'
                        }
                      }}
                    >
                      <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" component="h1" sx={{ 
                      fontWeight: 700, 
                      color: 'text.primary',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                    }}>
                      {selectedCategoryData?.nameEn && selectedCategoryData.nameEn.trim() 
                        ? selectedCategoryData.nameEn 
                        : selectedCategoryData?.name}
                    </Typography>
                  </Box>

                  {/* Category Header Image */}
                  {selectedCategoryData?.imageUrl && (
                    <Box
                      sx={{
                        position: 'relative',
                        borderRadius: 4,
                        overflow: 'hidden',
                        mb: 4,
                        height: 200,
                        background: `linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%), url(${selectedCategoryData.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {selectedCategoryData.description && (
                        <Typography
                          variant="h6"
                          sx={{
                            color: 'white',
                            textAlign: 'center',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                            fontWeight: 400,
                            maxWidth: 400,
                            px: 3
                          }}
                        >
                          {selectedCategoryData.description}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Menu Items */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {selectedCategoryData?.items?.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          duration: 0.3,
                          delay: index * 0.1
                        }}
                      >
                        <MenuItemCard item={item} />
                      </motion.div>
                    ))}
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Container>
        </Box>

        {/* Cart FAB */}
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

        {/* Dialogs and Overlays */}
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
    </LayoutGroup>
  );
};

export default OrderPage;
