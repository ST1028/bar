import { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { AddShoppingCart } from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import type { MenuItem } from '../../types';
import { useCartStore } from '../../stores/cart';

interface MenuItemCardProps {
  item: MenuItem;
}

const MenuItemCard = ({ item }: MenuItemCardProps) => {
  const quantity = 1; // Fixed at 1
  const [remarks, setRemarks] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { addItem } = useCartStore();

  const handleAddToCart = () => {
    if (item.isRemarksRequired && !remarks.trim()) {
      setDialogOpen(true);
      return;
    }
    
    addToCart();
  };

  const addToCart = () => {
    addItem({
      menuId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      remarks: remarks.trim(),
    });

    toast.success(`${item.name} をカートに追加しました`);
    // quantity is now fixed at 1
    setRemarks('');
    setDialogOpen(false);
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <Card sx={{ mb: 2, bgcolor: 'background.paper', overflow: 'hidden' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            {/* Header with image and title */}
            <Box sx={{ display: 'flex', mb: 2 }}>
              {item.thumbnail && item.thumbnail !== 'NULL' && (
                <CardMedia
                  component="img"
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    objectFit: 'cover', 
                    borderRadius: 1,
                    mr: 2,
                    flexShrink: 0
                  }}
                  image={item.thumbnail}
                  alt={item.name}
                />
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" component="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {item.name}
                </Typography>
                <Typography variant="h6" color="primary" fontWeight={600}>
                  ¥{item.price.toLocaleString()}
                </Typography>
                {item.description && item.description !== 'NULL' && item.description.trim() && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mt: 0.5
                    }}
                  >
                    {item.description}
                  </Typography>
                )}
                {item.isRemarksRequired && (
                  <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                    ※要備考
                  </Typography>
                )}
              </Box>
            </Box>
            
            {/* Add button - quantity fixed at 1 */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-end',
              gap: 1
            }}>
              <Button
                variant="contained"
                size="medium"
                onClick={handleAddToCart}
                sx={{ 
                  minWidth: 48,
                  width: 48,
                  height: 36,
                  p: 0
                }}
              >
                <AddShoppingCart />
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{item.name} - 備考入力</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="備考・注文内容"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="例: 氷少なめ、レモン多めなど"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
          <Button onClick={addToCart} variant="contained" disabled={!remarks.trim()}>
            カートに追加
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MenuItemCard;