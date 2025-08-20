import { Box, Typography } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import type { MenuCategory } from '../../types';

interface CategoryCardProps {
  category: MenuCategory;
  isSelected?: boolean;
  onClick?: () => void;
  layoutId: string;
}

const CategoryCard = ({ category, isSelected = false, onClick, layoutId }: CategoryCardProps) => {
  const shouldReduceMotion = useReducedMotion();
  
  const transition = shouldReduceMotion 
    ? { duration: 0 }
    : { 
        type: 'spring', 
        stiffness: 400, 
        damping: 30,
        mass: 0.8
      };

  return (
    <Box
      component={motion.div}
      layoutId={layoutId}
      onClick={onClick}
      layout
      transition={transition}
      sx={{
        position: 'relative',
        borderRadius: 2, // 丸みを半分に（4 -> 2）
        overflow: 'hidden',
        height: isSelected ? 200 : { xs: 280, sm: 320, md: 360 },
        background: category.imageUrl 
          ? `linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%), url(${category.imageUrl})`
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        cursor: isSelected ? 'default' : 'pointer',
        boxShadow: isSelected ? 'none' : '0 4px 20px rgba(0,0,0,0.1)',
        transition: isSelected ? 'none' : 'all 0.3s ease-in-out',
        mb: isSelected ? 4 : 0,
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        '&:hover': isSelected ? {} : { 
          boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          transform: 'translateY(-8px) scale(1.02)'
        }
      }}
      whileHover={isSelected ? {} : { y: -8, scale: 1.02 }}
      whileTap={isSelected ? {} : { scale: 0.96 }}
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
        <motion.div
          layout
          initial={false}
          animate={{
            display: isSelected ? 'flex' : 'block',
            alignItems: isSelected ? 'center' : 'flex-start',
            justifyContent: isSelected ? 'center' : 'flex-start',
            textAlign: isSelected ? 'center' : 'left',
            height: isSelected ? '200px' : 'auto'
          }}
          style={{
            position: isSelected ? 'absolute' : 'static',
            top: isSelected ? 0 : 'auto',
            left: isSelected ? 0 : 'auto',
            right: isSelected ? 0 : 'auto',
            bottom: isSelected ? 0 : 'auto',
            padding: isSelected ? '24px' : '0'
          }}
        >
          <Box>
            {!isSelected && (
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 300,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  letterSpacing: '-0.005em',
                  fontSize: { xs: '1.3rem', sm: '1.5rem', md: '1.7rem' },
                  lineHeight: 1.3,
                  mb: 0.5
                }}
              >
                {category.nameEn || category.name}
              </Typography>
            )}
            
            {isSelected && category.description ? (
              <Typography
                variant="h6"
                sx={{
                  color: 'white',
                  textAlign: 'center',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  fontWeight: 400,
                  maxWidth: 400,
                  margin: '0 auto'
                }}
              >
                {category.description}
              </Typography>
            ) : !isSelected && (
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
            )}
          </Box>
        </motion.div>
      </Box>

      {/* Item count badge - only show in list view */}
      {!isSelected && (
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
      )}
    </Box>
  );
};

export default CategoryCard;