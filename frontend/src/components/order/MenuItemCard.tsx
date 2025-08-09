import { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add, Remove, AddShoppingCart } from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import { MenuItem } from '../../types';
import { useCartStore } from '../../stores/cart';

interface MenuItemCardProps {
  item: MenuItem;
}

const MenuItemCard = ({ item }: MenuItemCardProps) => {
  const [quantity, setQuantity] = useState(1);
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

    toast.success(`${item.name} を${quantity}個カートに追加しました`);
    setQuantity(1);
    setRemarks('');
    setDialogOpen(false);
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex' }}>
            {item.thumbnail && (
              <CardMedia
                component="img"
                sx={{ width: 80, height: 80, objectFit: 'cover' }}
                image={item.thumbnail}
                alt={item.name}
              />
            )}
            <CardContent sx={{ flex: 1, p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" component="h4" noWrap>
                    {item.name}
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight={600}>
                    ¥{item.price.toLocaleString()}
                  </Typography>
                  {item.description && (
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {item.description}
                    </Typography>
                  )}
                  {item.isRemarksRequired && (
                    <Typography variant="caption" color="warning.main">
                      ※要備考
                    </Typography>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Remove />
                  </IconButton>
                  <Typography variant="body1" sx={{ mx: 1, minWidth: '20px', textAlign: 'center' }}>
                    {quantity}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={quantity >= 10}
                  >
                    <Add />
                  </IconButton>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddShoppingCart />}
                    onClick={handleAddToCart}
                    sx={{ ml: 1 }}
                  >
                    追加
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Box>
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