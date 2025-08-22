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
import { getNavigationHeight } from '../utils/pwa';

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
  
  const navigationHeight = getNavigationHeight();

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
        <Box sx={{ pt: 'calc(44px + 16px)', pb: `${navigationHeight + 16}px` }}> {/* ヘッダー44px + 余白16px、ナビゲーション高さ + 余白16px */}
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
                    <Typography variant="h1" component="h1" gutterBottom sx={{ 
                      fontWeight: 300, 
                      color: 'text.primary',
                      textAlign: 'center',
                      letterSpacing: '-0.02em',
                      fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                      lineHeight: 1.2
                    }}>
                      Menu
                    </Typography>
                  </Box>

                  {/* Category Grid */}
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr', // 1列に変更
                    gap: 2, // 縦方向の余白を追加
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
                  initial={{ 
                    opacity: 0,
                    scale: 0.92,
                    y: 20
                  }}
                  animate={{ 
                    opacity: 1,
                    scale: 1,
                    y: 0
                  }}
                  exit={{ 
                    opacity: 0,
                    scale: 0.96,
                    y: -10
                  }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8,
                    velocity: 2
                  }}
                  style={{ 
                    position: 'fixed', 
                    inset: 0, 
                    zIndex: 1100, 
                    background: '#ffffff',
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  <Box ref={detailScrollRef} sx={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
                    <Container maxWidth="lg" sx={{ px: 2, pt: 'calc(44px + 24px)', pb: 10 }}> {/* ヘッダー44px + 余白24px */}
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
                    <Typography variant="h2" component="h1" sx={{ 
                      fontWeight: 300, 
                      color: 'text.primary',
                      letterSpacing: '-0.01em',
                      fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.8rem' },
                      lineHeight: 1.3
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
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {selectedCategoryData?.items?.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 30, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ 
                            type: 'spring',
                            stiffness: 350,
                            damping: 25,
                            mass: 0.8,
                            delay: Math.min(index * 0.08, 0.4)
                          }}
                        >
                          <MenuItemCard item={item} />
                        </motion.div>
                      ))}
                    </Box>
                  </motion.div>
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
              bottom: navigationHeight + 16, // ナビゲーション高さ + 余白16px
              right: 16,
              zIndex: 1200 // 詳細画面(1100)より高く設定
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
