import { useState, useRef } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { Player } from '@lordicon/react';

import type { MenuItem } from '../../types';
import { useCartStore } from '../../stores/cart';
import { blendAPI } from '../../services/api';
import plusIconAnimation from '../../icons/wired-outline-2158-plus-math-hover-draw.json';

interface MenuItemCardProps {
  item: MenuItem;
}

const MenuItemCard = ({ item }: MenuItemCardProps) => {
  const quantity = 1; // Fixed at 1
  const [remarks, setRemarks] = useState('');
  const [selectedBlendId, setSelectedBlendId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const playerRef = useRef<Player>(null);
  const { addItem } = useCartStore();

  const { data: blends } = useQuery({
    queryKey: ['blends'],
    queryFn: blendAPI.getBlends,
  });

  const availableBlends = blends?.filter(blend => 
    blend.isActive && item.availableBlends?.includes(blend.id)
  ) || [];
  const hasBlendOptions = availableBlends.length > 0;

  const handleAddToCart = () => {
    if (item.isRemarksRequired && !remarks.trim()) {
      setDialogOpen(true);
      return;
    }
    
    if (hasBlendOptions && !selectedBlendId) {
      setDialogOpen(true);
      return;
    }
    
    addToCart();
  };

  const addToCart = () => {
    const selectedBlend = selectedBlendId ? availableBlends.find(b => b.id === selectedBlendId) : undefined;
    
    // アニメーションをトリガー
    if (playerRef.current) {
      playerRef.current.playFromBeginning();
    }
    
    addItem({
      menuId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      remarks: remarks.trim(),
      blendId: selectedBlendId || undefined,
      blendName: selectedBlend?.name || undefined,
    });

    const blendText = selectedBlend ? ` (${selectedBlend.name})` : '';
    toast.success(`${item.name}${blendText} をカートに追加しました`);
    setRemarks('');
    setSelectedBlendId('');
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
                      mt: 0.5,
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {item.description.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')}
                  </Typography>
                )}
                {item.isRemarksRequired && (
                  <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                    ※要備考
                  </Typography>
                )}
                {hasBlendOptions && (
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      選択可能なブレンド:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.25 }}>
                      {availableBlends.map((blend) => (
                        <Chip 
                          key={blend.id} 
                          label={blend.name} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: '16px' }}
                        />
                      ))}
                    </Box>
                  </Box>
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
                  p: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Player
                  ref={playerRef}
                  icon={plusIconAnimation}
                  size={24}
                  colorize="#ffffff"
                />
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {item.name} - 
          {hasBlendOptions && item.isRemarksRequired ? ' ブレンド・備考選択' : 
           hasBlendOptions ? ' ブレンド選択' : ' 備考入力'}
        </DialogTitle>
        <DialogContent>
          {hasBlendOptions && (
            <FormControl fullWidth margin="dense" sx={{ mt: 2 }}>
              <InputLabel>ブレンド選択 *</InputLabel>
              <Select
                value={selectedBlendId}
                onChange={(e) => setSelectedBlendId(e.target.value)}
                label="ブレンド選択 *"
              >
                {availableBlends.map((blend) => (
                  <MuiMenuItem key={blend.id} value={blend.id}>
                    {blend.name}
                    {blend.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        - {blend.description}
                      </Typography>
                    )}
                  </MuiMenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          {item.isRemarksRequired && (
            <TextField
              autoFocus={!hasBlendOptions}
              margin="dense"
              label="備考・注文内容 *"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="例: 氷少なめ、レモン多めなど"
              sx={{ mt: 2 }}
            />
          )}
          
          {!item.isRemarksRequired && (
            <TextField
              margin="dense"
              label="備考・注文内容（任意）"
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="例: 氷少なめ、レモン多めなど"
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
          <Button 
            onClick={addToCart} 
            variant="contained" 
            disabled={
              (item.isRemarksRequired && !remarks.trim()) || 
              (hasBlendOptions && !selectedBlendId)
            }
          >
            カートに追加
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MenuItemCard;