import { Grid, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';
import type { MenuCategory } from '../../types';
import MenuCategoryCard from './MenuCategoryCard';

interface MenuCategoryListProps {
  categories: MenuCategory[];
}

const MenuCategoryList = ({ categories }: MenuCategoryListProps) => {
  if (categories.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          メニューがありません
        </Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        メニューカテゴリ
      </Typography>
      <Grid container spacing={2}>
        {categories.map((category, index) => (
          <Grid item xs={6} sm={4} md={3} key={category.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <MenuCategoryCard category={category} />
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </motion.div>
  );
};

export default MenuCategoryList;