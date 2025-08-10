import { useState, useMemo } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { History, ExpandMore } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

import { orderAPI, patronAPI } from '../services/api';
import { Order } from '../types';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorMessage from '../components/ErrorMessage';

const HistoryPage = () => {
  const [selectedPatronId, setSelectedPatronId] = useState<string>('');

  const { data: patrons } = useQuery({
    queryKey: ['patrons'],
    queryFn: patronAPI.getPatrons,
  });

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders', selectedPatronId],
    queryFn: () => orderAPI.getOrders(selectedPatronId || undefined),
  });

  const handlePatronChange = (event: SelectChangeEvent<string>) => {
    setSelectedPatronId(event.target.value);
  };

  // Group orders by patron - must be called before conditional returns
  const groupedOrders = useMemo(() => {
    if (!orders) return [];
    
    const grouped = orders.reduce((acc, order) => {
      const existingGroup = acc.find(group => group.patronId === order.patronId);
      
      if (existingGroup) {
        existingGroup.orders.push(order);
        existingGroup.totalAmount += order.total;
        existingGroup.totalItems += order.items.reduce((sum, item) => sum + item.quantity, 0);
        // Update latest order date if this order is more recent
        if (new Date(order.createdAt) > new Date(existingGroup.latestOrderDate)) {
          existingGroup.latestOrderDate = order.createdAt;
        }
      } else {
        acc.push({
          patronId: order.patronId,
          patronName: order.patronName,
          orders: [order],
          totalAmount: order.total,
          totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
          latestOrderDate: order.createdAt,
        });
      }
      
      return acc;
    }, [] as Array<{
      patronId: string;
      patronName: string;
      orders: Order[];
      totalAmount: number;
      totalItems: number;
      latestOrderDate: string;
    }>);
    
    // Sort by latest order date (most recent first)
    return grouped.sort((a, b) => new Date(b.latestOrderDate).getTime() - new Date(a.latestOrderDate).getTime());
  }, [orders]);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage message="注文履歴の読み込みに失敗しました" />;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '処理中';
      case 'completed':
        return '完了';
      case 'cancelled':
        return 'キャンセル';
      default:
        return status;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ mt: 8, mb: 2 }}>
        <Container maxWidth="lg">
          <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
            注文履歴
          </Typography>

          {patrons && patrons.length > 0 && (
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>注文者でフィルター</InputLabel>
              <Select
                value={selectedPatronId}
                label="注文者でフィルター"
                onChange={handlePatronChange}
              >
                <MenuItem value="">すべて</MenuItem>
                {patrons.map((patron) => (
                  <MenuItem key={patron.id} value={patron.id}>
                    {patron.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {!groupedOrders || groupedOrders.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <History sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                注文履歴がありません
              </Typography>
              <Typography variant="body2" color="text.secondary">
                注文をすると、ここに履歴が表示されます
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <AnimatePresence>
                {groupedOrders.map((patronGroup, index) => (
                  <motion.div
                    key={patronGroup.patronId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <Card elevation={2}>
                      <CardContent sx={{ pb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" component="h3">
                              {patronGroup.patronName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              最新注文: {new Date(patronGroup.latestOrderDate).toLocaleString('ja-JP')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              注文回数: {patronGroup.orders.length}回 / 総アイテム数: {patronGroup.totalItems}個
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Typography variant="h5" color="primary" fontWeight={600}>
                              ¥{patronGroup.totalAmount.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              合計金額
                            </Typography>
                          </Box>
                        </Box>

                        {patronGroup.orders.map((order, orderIndex) => (
                          <Accordion key={order.id} elevation={0} sx={{ bgcolor: 'grey.50', mb: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mr: 2 }}>
                                <Box>
                                  <Typography variant="subtitle2">
                                    注文 #{orderIndex + 1}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(order.createdAt).toLocaleString('ja-JP')}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip
                                    label={getStatusText(order.status)}
                                    color={getStatusColor(order.status) as any}
                                    size="small"
                                  />
                                  <Typography variant="body2" fontWeight={600}>
                                    ¥{order.total.toLocaleString()}
                                  </Typography>
                                </Box>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                              <List dense sx={{ py: 0 }}>
                                {order.items.map((item, itemIndex) => (
                                  <ListItem key={itemIndex} sx={{ py: 0.5, pl: 0 }}>
                                    <ListItemText
                                      primary={`${item.name} × ${item.quantity}`}
                                      secondary={item.remarks ? `備考: ${item.remarks}` : undefined}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                      ¥{item.subtotal.toLocaleString()}
                                    </Typography>
                                  </ListItem>
                                ))}
                              </List>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Box>
          )}
        </Container>
      </Box>
    </motion.div>
  );
};

export default HistoryPage;