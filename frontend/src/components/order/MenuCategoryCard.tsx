import { useState } from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Collapse } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import type { MenuCategory } from '../../types';
import MenuItemCard from './MenuItemCard';

interface MenuCategoryCardProps {
  category: MenuCategory;
}

const MenuCategoryCard = ({ category }: MenuCategoryCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const handleClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          onClick={handleClick}
          sx={{
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: (theme) => theme.shadows[8],
            },
          }}
        >
          <CardMedia
            component="img"
            height="120"
            image={category.thumbnail || '/api/placeholder/300/120'}
            alt={category.name}
            sx={{ objectFit: 'cover' }}
          />
          <CardContent sx={{ pb: 2 }}>
            <Typography variant="h6" component="h3" noWrap>
              {category.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {category.items?.length || 0}品目
            </Typography>
          </CardContent>
        </Card>
      </motion.div>

      <Collapse in={expanded} timeout={300}>
        <Box sx={{ mt: 2, pl: 1 }}>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  {category.name}のメニュー
                </Typography>
                {category.items?.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <MenuItemCard item={item} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Collapse>
    </Box>
  );
};

export default MenuCategoryCard;