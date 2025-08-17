import { useRef } from 'react';
import { Box, Typography, IconButton, TextField, ButtonGroup, Button } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Player } from '@lordicon/react';

import trashAnimation from '../../icons/wired-outline-185-trash-bin-hover-empty.json';

import type { CartItem } from '../../types';
import { useCartStore } from '../../stores/cart';

interface CartItemCardProps {
  item: CartItem;
}

const CartItemCard = ({ item }: CartItemCardProps) => {
  const { removeItem, updateRemarks, updateQuantity } = useCartStore();
  const deleteIconRef = useRef<Player>(null);

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
            onClick={() => {
              if (deleteIconRef.current) {
                deleteIconRef.current.playFromBeginning();
              }
              removeItem(item.menuId);
            }}
          >
            <Player
              ref={deleteIconRef}
              icon={trashAnimation}
              size={20}
              colorize="#f44336"
            />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              個数:
            </Typography>
            <ButtonGroup size="small" variant="outlined">
              <Button
                onClick={() => updateQuantity(item.menuId, Math.max(1, item.quantity - 1))}
                disabled={item.quantity <= 1}
                sx={{ minWidth: '32px', padding: '4px' }}
              >
                <Remove fontSize="small" />
              </Button>
              <Button
                disabled
                sx={{ 
                  minWidth: '40px', 
                  padding: '4px 8px',
                  '&.Mui-disabled': { 
                    color: 'text.primary',
                    borderColor: 'divider'
                  }
                }}
              >
                {item.quantity}
              </Button>
              <Button
                onClick={() => updateQuantity(item.menuId, item.quantity + 1)}
                sx={{ minWidth: '32px', padding: '4px' }}
              >
                <Add fontSize="small" />
              </Button>
            </ButtonGroup>
          </Box>
          <Typography variant="subtitle1" color="primary" fontWeight={600}>
            ¥{(item.price * item.quantity).toLocaleString()}
          </Typography>
        </Box>

        {item.blendName && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              ブレンド:
            </Typography>
            <Typography variant="body2" color="primary" sx={{ ml: 1, fontWeight: 500 }}>
              {item.blendName}
            </Typography>
          </Box>
        )}

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