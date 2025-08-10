import { Box, Typography, IconButton, TextField } from '@mui/material';
import { Add, Remove, Delete } from '@mui/icons-material';
import { motion } from 'framer-motion';

import type { CartItem } from '../../types';
import { useCartStore } from '../../stores/cart';

interface CartItemCardProps {
  item: CartItem;
}

const CartItemCard = ({ item }: CartItemCardProps) => {
  const { updateQuantity, removeItem, updateRemarks } = useCartStore();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(item.menuId);
    } else {
      updateQuantity(item.menuId, newQuantity);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      style={{ width: '100%' }}
    >
      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          p: 2,
          width: '100%',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {item.name}
          </Typography>
          <IconButton
            size="small"
            color="error"
            onClick={() => removeItem(item.menuId)}
          >
            <Delete />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            ¥{item.price.toLocaleString()} × {item.quantity}
          </Typography>
          <Typography variant="subtitle1" color="primary" fontWeight={600}>
            ¥{(item.price * item.quantity).toLocaleString()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton
            size="small"
            onClick={() => handleQuantityChange(item.quantity - 1)}
          >
            <Remove />
          </IconButton>
          <Typography sx={{ mx: 2, minWidth: '30px', textAlign: 'center' }}>
            {item.quantity}
          </Typography>
          <IconButton
            size="small"
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={item.quantity >= 10}
          >
            <Add />
          </IconButton>
        </Box>

        <TextField
          label="備考"
          fullWidth
          size="small"
          value={item.remarks || ''}
          onChange={(e) => updateRemarks(item.menuId, e.target.value)}
          placeholder="氷少なめ、レモン多めなど"
          variant="outlined"
        />
      </Box>
    </motion.div>
  );
};

export default CartItemCard;