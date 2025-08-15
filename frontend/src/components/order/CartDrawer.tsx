import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  Divider,
  Button,
  IconButton,
} from '@mui/material';
import { Close, Person, ShoppingCart } from '@mui/icons-material';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import { useCartStore } from '../../stores/cart';
import { orderAPI, patronAPI } from '../../services/api';
import CartItemCard from './CartItemCard';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onPatronSelect: () => void;
}

const CartDrawer = ({ open, onClose, onPatronSelect }: CartDrawerProps) => {
  const { items, selectedPatronId, getTotalAmount, clearCart } = useCartStore();
  const queryClient = useQueryClient();

  const { data: patrons } = useQuery({
    queryKey: ['patrons'],
    queryFn: patronAPI.getPatrons,
  });

  const selectedPatron = patrons?.find((p: any) => p.id === selectedPatronId);

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
      ModalProps={{
        keepMounted: false,
        disableEnforceFocus: true,
        disableAutoFocus: true,
        disableRestoreFocus: true,
        onClick: (e) => {
          // バックドロップクリックで閉じる
          if (e.target === e.currentTarget) {
            onClose();
          }
        }
      }}
      SlideProps={{
        style: { zIndex: 1300 }
      }}
    >
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ShoppingCart sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            カート ({items.length}品目)
          </Typography>
          <IconButton 
            onClick={onClose}
            sx={{ 
              minWidth: 44, 
              minHeight: 44,
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <Close />
          </IconButton>
        </Box>

        <Box sx={{ mb: 2 }}>
          {selectedPatron ? (
            <Box sx={{ 
              border: 1, 
              borderColor: 'primary.main', 
              borderRadius: 2, 
              p: 2,
              bgcolor: 'primary.light',
              color: 'primary.contrastText'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person />
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      注文者
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {selectedPatron.name}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onPatronSelect}
                  sx={{ 
                    borderColor: 'primary.contrastText',
                    color: 'primary.contrastText',
                    '&:hover': {
                      borderColor: 'primary.contrastText',
                      bgcolor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  変更
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ 
              border: 1, 
              borderColor: 'warning.main', 
              borderRadius: 2, 
              p: 2,
              bgcolor: 'warning.light',
              textAlign: 'center'
            }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'warning.dark' }}>
                注文者を選択してください
              </Typography>
              <Button
                variant="contained"
                onClick={onPatronSelect}
                sx={{ 
                  bgcolor: 'warning.main',
                  '&:hover': {
                    bgcolor: 'warning.dark'
                  }
                }}
              >
                注文者を選択
              </Button>
            </Box>
          )}
        </Box>


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