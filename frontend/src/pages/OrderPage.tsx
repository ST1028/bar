import { useState, useEffect, useRef } from 'react';
import { Box, Container, Fab, Badge, Typography, IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Player } from '@lordicon/react';

import { menuAPI, patronAPI } from '../services/api';
import { useCartStore } from '../stores/cart';
import MenuItemCard from '../components/order/MenuItemCard';
import CategoryCard from '../components/order/CategoryCard';
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
  const listScrollYRef = useRef(0);
  const detailScrollRef = useRef<HTMLDivElement | null>(null);
  const cartIconRef = useRef<Player>(null);
  const { getItemCount, setOnItemAdded } = useCartStore();
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const categoryPositionsRef = useRef<Record<string, number>>({});

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

  // When opening detail, ensure its scroll starts at top (overlay container)
  useEffect(() => {
    if (selectedCategory && detailScrollRef.current) {
      detailScrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [selectedCategory]);

  const handleBack = () => {
    // Snap background list to the tapped category's top before closing overlay
    if (selectedCategory) {
      const savedPosition = categoryPositionsRef.current[selectedCategory];
      if (savedPosition !== undefined) {
        // Adjust for header height (pt: 8 = 64px)
        const headerHeight = 64;
        window.scrollTo({ top: Math.max(0, savedPosition - headerHeight), behavior: 'auto' });
      }
    }
    setSelectedCategory(null);
  };

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
            {/* Category List stays mounted to preserve scroll/positions */}
            <motion.div
              key="categories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18 }}
              aria-hidden={!!selectedCategory}
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
                        ref={(el: HTMLDivElement | null) => { categoryRefs.current[category.id] = el; }}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.14, delay: index * 0.04, type: 'tween', ease: 'easeOut' }}
                      >
                        <CategoryCard
                          category={category}
                          layoutId={`category-card-${category.id}`}
                          onClick={() => {
                            // Save current scroll position and category element position
                            listScrollYRef.current = window.scrollY;
                            const el = categoryRefs.current[category.id];
                            if (el) {
                              const rect = el.getBoundingClientRect();
                              categoryPositionsRef.current[category.id] = rect.top + window.scrollY;
                            }
                            setSelectedCategory(category.id);
                          }}
                        />
                      </motion.div>
                    ))}
                  </Box>
            </motion.div>

            {/* Detail overlay renders on top; fixed so background scroll stays */}
            <AnimatePresence mode="wait">
              {selectedCategory && (
                <motion.div
                  key="menu-detail"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ 
                    duration: 0.25,
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8
                  }}
                  style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'var(--mui-palette-background-default, #fff)' }}
                >
                  <Box ref={detailScrollRef} sx={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
                    <Container maxWidth="lg" sx={{ px: 2, pt: 8, pb: 10 }}>
                  {/* Back Button and Header */}
                  <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton
                      onClick={handleBack}
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

                  {/* Category Header with Shared Layout Animation */}
                  {selectedCategoryData && (
                    <CategoryCard
                      category={selectedCategoryData}
                      isSelected={true}
                      layoutId={`category-card-${selectedCategory}`}
                    />
                  )}

                  {/* Menu Items */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {selectedCategoryData?.items?.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          duration: 0.3,
                          delay: Math.min(index * 0.05, 0.3),
                          type: 'spring',
                          stiffness: 400,
                          damping: 30,
                          mass: 0.8
                        }}
                      >
                        <MenuItemCard item={item} />
                      </motion.div>
                    ))}
                  </Box>
                    </Container>
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
