import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  Divider,
  Button,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import { Close, Person, ShoppingCart } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import { useCartStore } from '../../stores/cart';
import { orderAPI } from '../../services/api';
import CartItemCard from './CartItemCard';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onPatronSelect: () => void;
}

const CartDrawer = ({ open, onClose, onPatronSelect }: CartDrawerProps) => {
  const { items, selectedPatronId, getTotalAmount, clearCart } = useCartStore();
  const queryClient = useQueryClient();

  const queryData = queryClient.getQueryData(['patrons']) as { patrons: any[] } | undefined;
  const patrons = queryData?.patrons || [];
  const selectedPatron = patrons.find((p: any) => p.id === selectedPatronId);

  const createOrderMutation = useMutation({
    mutationFn: ({ patronId, items }: { patronId: string; items: any[] }) =>
      orderAPI.createOrder(patronId, items),
    onSuccess: () => {
      toast.success('注文を送信しました！');
      clearCart();
      onClose();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '注文の送信に失敗しました');
    },
  });

  const handleOrder = () => {
    if (!selectedPatronId) {
      onPatronSelect();
      return;
    }
    createOrderMutation.mutate({ patronId: selectedPatronId, items });
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 400 } },
      }}
    >
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ShoppingCart sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            カート ({items.length}品目)
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        {selectedPatron && (
          <Box sx={{ mb: 2 }}>
            <Chip
              icon={<Person />}
              label={`注文者: ${selectedPatron.name}`}
              color="primary"
              onClick={onPatronSelect}
              sx={{ mb: 1 }}
            />
          </Box>
        )}

        {!selectedPatronId && items.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            注文者を選択してください
          </Alert>
        )}

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <AnimatePresence>
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ShoppingCart sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    カートが空です
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    メニューを選んで注文を開始してください
                  </Typography>
                  <Button 
                    variant="outlined" 
                    onClick={onClose}
                    sx={{ 
                      minWidth: 120,
                      minHeight: 44
                    }}
                  >
                    閉じる
                  </Button>
                </Box>
              </motion.div>
            ) : (
              <List sx={{ p: 0 }}>
                {items.map((item, index) => (
                  <motion.div
                    key={item.menuId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <ListItem sx={{ px: 0 }}>
                      <CartItemCard item={item} />
                    </ListItem>
                  </motion.div>
                ))}
              </List>
            )}
          </AnimatePresence>
        </Box>

        {items.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">合計</Typography>
              <Typography variant="h6" color="primary" fontWeight={600}>
                ¥{getTotalAmount().toLocaleString()}
              </Typography>
            </Box>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleOrder}
              disabled={createOrderMutation.isPending}
              sx={{ mb: 1 }}
            >
              {createOrderMutation.isPending ? '注文中...' : '注文する'}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => clearCart()}
              disabled={createOrderMutation.isPending}
            >
              カートをクリア
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default CartDrawer;