import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Switch,
  FormControlLabel,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Drawer,
  Fab,
} from '@mui/material';
import {
  AdminPanelSettings,
  DeleteSweep,
  Warning,
  Edit,
  Delete,
  Save,
  Cancel,
  Category,
  Restaurant,
  Visibility,
  VisibilityOff,
  LocalBar,
} from '@mui/icons-material';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import { adminAPI, menuAPI, blendAPI } from '../services/api';
import type { MenuItem as MenuItemType, MenuCategory, Blend } from '../types';
import { useAuthStore } from '../stores/auth';

const AdminPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [editingBlend, setEditingBlend] = useState<Blend | null>(null);
  const [addItemDrawerOpen, setAddItemDrawerOpen] = useState(false);
  const [addCategoryDrawerOpen, setAddCategoryDrawerOpen] = useState(false);
  const [addBlendDrawerOpen, setAddBlendDrawerOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', description: '', recipe: '', price: 0, categoryId: '', availableBlends: [] as string[], isActive: true });
  const [newCategory, setNewCategory] = useState({ name: '', description: '', imageUrl: '', visible: true });
  const [newBlend, setNewBlend] = useState({ name: '', description: '', isActive: true });
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Queries
  const { data: menuItems } = useQuery({
    queryKey: ['menu-items'],
    queryFn: menuAPI.getMenuItems,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: menuAPI.getCategories,
  });

  const { data: blends } = useQuery({
    queryKey: ['blends'],
    queryFn: blendAPI.getBlends,
  });

  // Mutations
  const resetAllMutation = useMutation({
    mutationFn: adminAPI.resetAllOrders,
    onSuccess: (data) => {
      toast.success(`${data.deletedCount}件のデータをリセットしました`);
      setResetDialogOpen(false);
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'リセットに失敗しました');
    },
  });

  const createItemMutation = useMutation({
    mutationFn: (item: any) => menuAPI.createMenuItem(item),
    onSuccess: () => {
      toast.success('メニューアイテムを作成しました');
      setNewItem({ name: '', description: '', recipe: '', price: 0, categoryId: '', availableBlends: [], isActive: true });
      setAddItemDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
    onError: () => toast.error('作成に失敗しました'),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, ...item }: any) => menuAPI.updateMenuItem(id, item),
    onSuccess: () => {
      toast.success('メニューアイテムを更新しました');
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
    onError: () => toast.error('更新に失敗しました'),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => menuAPI.deleteMenuItem(id),
    onSuccess: () => {
      toast.success('メニューアイテムを削除しました');
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
    onError: () => toast.error('削除に失敗しました'),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (category: any) => menuAPI.createCategory(category),
    onSuccess: () => {
      toast.success('カテゴリーを作成しました');
      setNewCategory({ name: '', description: '', imageUrl: '', visible: true });
      setAddCategoryDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: () => toast.error('作成に失敗しました'),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, ...category }: any) => menuAPI.updateCategory(id, category),
    onSuccess: () => {
      toast.success('カテゴリーを更新しました');
      setEditingCategory(null);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: () => toast.error('更新に失敗しました'),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => menuAPI.deleteCategory(id),
    onSuccess: () => {
      toast.success('カテゴリーを削除しました');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: () => toast.error('削除に失敗しました'),
  });

  const createBlendMutation = useMutation({
    mutationFn: (blend: any) => blendAPI.createBlend(blend),
    onSuccess: () => {
      toast.success('ブレンドを作成しました');
      setNewBlend({ name: '', description: '', isActive: true });
      setAddBlendDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['blends'] });
    },
    onError: () => toast.error('作成に失敗しました'),
  });

  const updateBlendMutation = useMutation({
    mutationFn: ({ id, ...blend }: any) => blendAPI.updateBlend(id, blend),
    onSuccess: () => {
      toast.success('ブレンドを更新しました');
      setEditingBlend(null);
      queryClient.invalidateQueries({ queryKey: ['blends'] });
    },
    onError: () => toast.error('更新に失敗しました'),
  });

  const deleteBlendMutation = useMutation({
    mutationFn: (id: string) => blendAPI.deleteBlend(id),
    onSuccess: () => {
      toast.success('ブレンドを削除しました');
      queryClient.invalidateQueries({ queryKey: ['blends'] });
    },
    onError: () => toast.error('削除に失敗しました'),
  });

  // Handlers
  const handleResetAll = () => {
    resetAllMutation.mutate();
  };

  const handleCreateItem = () => {
    if (!newItem.name || !newItem.categoryId || newItem.price <= 0) {
      toast.error('必須項目を入力してください');
      return;
    }
    createItemMutation.mutate(newItem);
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;
    updateItemMutation.mutate({
      id: editingItem.id,
      name: editingItem.name,
      price: editingItem.price,
      description: editingItem.description,
      recipe: editingItem.recipe,
      categoryId: editingItem.categoryId,
      availableBlends: editingItem.availableBlends,
      isActive: editingItem.isActive
    });
  };

  const handleCreateCategory = () => {
    if (!newCategory.name) {
      toast.error('カテゴリー名を入力してください');
      return;
    }
    createCategoryMutation.mutate(newCategory);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    updateCategoryMutation.mutate({
      id: editingCategory.id,
      name: editingCategory.name,
      description: editingCategory.description,
      imageUrl: editingCategory.imageUrl,
      visible: editingCategory.visible,
      order: editingCategory.order
    });
  };

  const handleCreateBlend = () => {
    if (!newBlend.name) {
      toast.error('ブレンド名を入力してください');
      return;
    }
    createBlendMutation.mutate(newBlend);
  };

  const handleUpdateBlend = () => {
    if (!editingBlend) return;
    updateBlendMutation.mutate({
      id: editingBlend.id,
      name: editingBlend.name,
      description: editingBlend.description,
      isActive: editingBlend.isActive,
      order: editingBlend.order
    });
  };

  // Check if user is admin (basic check)
  const isAdmin = user?.groups?.includes('admin') || user?.email === 'admin@example.com';

  if (!isAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ mt: 8, mb: 2 }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Warning sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" color="error" gutterBottom>
                アクセス権限がありません
              </Typography>
              <Typography variant="body1" color="text.secondary">
                管理者権限が必要です
              </Typography>
            </Box>
          </Container>
        </Box>
      </motion.div>
    );
  }

  const renderMenuManagement = () => (
    <Box>
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            <Restaurant sx={{ mr: 1, verticalAlign: 'middle' }} />
メニューアイテム管理
          </Typography>
          <Divider sx={{ mb: 2 }} />
          

          {/* Menu items list */}
          <List>
            {menuItems?.map((item) => (
              <ListItem 
                key={item.id} 
                divider
                sx={{
                  opacity: item.isActive === false ? 0.5 : 1,
                  bgcolor: item.isActive === false ? 'action.hover' : 'inherit'
                }}
              >
                {editingItem?.id === item.id ? (
                  <Box sx={{ width: '100%' }}>
                    <Grid container spacing={2} sx={{ mb: 1 }}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          value={editingItem.name}
                          onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          type="number"
                          value={editingItem.price}
                          onChange={(e) => setEditingItem({...editingItem, price: Number(e.target.value)})}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                          <Select
                            value={editingItem.categoryId}
                            onChange={(e) => setEditingItem({...editingItem, categoryId: e.target.value})}
                          >
                            {categories?.map(cat => (
                              <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                    <TextField
                      value={(editingItem.description || '').replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')}
                      onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      sx={{ mb: 1 }}
                      placeholder="説明"
                    />
                    <TextField
                      value={(editingItem.recipe || '').replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')}
                      onChange={(e) => setEditingItem({...editingItem, recipe: e.target.value})}
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      sx={{ mb: 1 }}
                      placeholder="レシピ・作り方"
                    />
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>ブレンド（任意）</InputLabel>
                      <Select
                        multiple
                        value={editingItem.availableBlends || []}
                        onChange={(e) => setEditingItem({
                          ...editingItem, 
                          availableBlends: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
                        })}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => {
                              const blend = blends?.find(b => b.id === value);
                              return (
                                <Chip key={value} label={blend?.name || value} size="small" />
                              );
                            })}
                          </Box>
                        )}
                      >
                        {blends?.filter(blend => blend.isActive).map((blend) => (
                          <MenuItem key={blend.id} value={blend.id}>
                            {blend.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <IconButton onClick={handleUpdateItem} color="primary" size="large">
                        <Save />
                      </IconButton>
                      <IconButton onClick={() => setEditingItem(null)} size="large">
                        <Cancel />
                      </IconButton>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <ListItemText
                      primary={item.name}
                      secondary={
                        <Box sx={{ pr: 10 }}>
                          <Typography variant="body2" color="text.secondary">
                            ¥{item.price.toLocaleString()} - {categories?.find(c => c.id === item.categoryId)?.name}
                          </Typography>
                          {item.description && (
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                mt: 0.5, 
                                whiteSpace: 'pre-line',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              説明: {item.description.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')}
                            </Typography>
                          )}
                          {item.recipe && (
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                mt: 0.5, 
                                whiteSpace: 'pre-line',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              レシピ: {item.recipe.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')}
                            </Typography>
                          )}
                          {item.availableBlends && item.availableBlends.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">ブレンド: </Typography>
                              {item.availableBlends.map((blendId) => {
                                const blend = blends?.find(b => b.id === blendId);
                                return (
                                  <Chip 
                                    key={blendId} 
                                    label={blend?.name || 'Unknown'} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: '18px' }}
                                  />
                                );
                              })}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        onClick={() => updateItemMutation.mutate({ 
                          id: item.id, 
                          isActive: !item.isActive 
                        })} 
                        size="small"
                        color={item.isActive ? "primary" : "default"}
                        title={item.isActive ? "メニューを非表示にする" : "メニューを表示する"}
                      >
                        {item.isActive ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                      <IconButton onClick={() => setEditingItem(item)} size="small">
                        <Edit />
                      </IconButton>
                      <IconButton 
                        onClick={() => deleteItemMutation.mutate(item.id)} 
                        size="small" 
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </>
                )}
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );

  const renderCategoryManagement = () => (
    <Box>
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            <Category sx={{ mr: 1, verticalAlign: 'middle' }} />
カテゴリー管理
          </Typography>
          <Divider sx={{ mb: 2 }} />
          

          {/* Categories list */}
          <List>
            {categories?.map((category) => (
              <ListItem key={category.id} divider>
                {editingCategory?.id === category.id ? (
                  <Box sx={{ width: '100%' }}>
                    <Grid container spacing={2} sx={{ mb: 1 }}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={editingCategory.visible}
                              onChange={(e) => setEditingCategory({...editingCategory, visible: e.target.checked})}
                            />
                          }
                          label="表示"
                        />
                      </Grid>
                    </Grid>
                    <TextField
                      value={editingCategory.description || ''}
                      onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})}
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      sx={{ mb: 1 }}
                      placeholder="説明"
                    />
                    <TextField
                      value={editingCategory.imageUrl || ''}
                      onChange={(e) => setEditingCategory({...editingCategory, imageUrl: e.target.value})}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                      placeholder="画像URL"
                      label="画像URL"
                    />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <IconButton onClick={handleUpdateCategory} color="primary" size="large">
                        <Save />
                      </IconButton>
                      <IconButton onClick={() => setEditingCategory(null)} size="large">
                        <Cancel />
                      </IconButton>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {category.name}
                          <Chip
                            icon={category.visible !== false ? <Visibility /> : <VisibilityOff />}
                            label={category.visible !== false ? '表示' : '非表示'}
                            size="small"
                            color={category.visible !== false ? 'success' : 'default'}
                          />
                        </Box>
                      }
                      secondary={category.description || '説明なし'}
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => setEditingCategory(category)} size="small">
                        <Edit />
                      </IconButton>
                      <IconButton 
                        onClick={() => deleteCategoryMutation.mutate(category.id)} 
                        size="small" 
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </>
                )}
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );

  const renderBlendManagement = () => (
    <Box>
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            🍯 ブレンド管理
          </Typography>
          <Divider sx={{ mb: 2 }} />
          

          {/* Blends list */}
          <List>
            {blends?.map((blend) => (
              <ListItem key={blend.id} divider>
                {editingBlend?.id === blend.id ? (
                  <Box sx={{ width: '100%' }}>
                    <Grid container spacing={2} sx={{ mb: 1 }}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          value={editingBlend.name}
                          onChange={(e) => setEditingBlend({...editingBlend, name: e.target.value})}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={editingBlend.isActive}
                              onChange={(e) => setEditingBlend({...editingBlend, isActive: e.target.checked})}
                            />
                          }
                          label="表示"
                        />
                      </Grid>
                    </Grid>
                    <TextField
                      value={editingBlend.description || ''}
                      onChange={(e) => setEditingBlend({...editingBlend, description: e.target.value})}
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      sx={{ mb: 2 }}
                      placeholder="説明"
                    />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <IconButton onClick={handleUpdateBlend} color="primary" size="large">
                        <Save />
                      </IconButton>
                      <IconButton onClick={() => setEditingBlend(null)} size="large">
                        <Cancel />
                      </IconButton>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {blend.name}
                          <Chip
                            icon={blend.isActive ? <Visibility /> : <VisibilityOff />}
                            label={blend.isActive ? '表示' : '非表示'}
                            size="small"
                            color={blend.isActive ? 'success' : 'default'}
                          />
                        </Box>
                      }
                      secondary={blend.description || '説明なし'}
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => setEditingBlend(blend)} size="small">
                        <Edit />
                      </IconButton>
                      <IconButton 
                        onClick={() => deleteBlendMutation.mutate(blend.id)} 
                        size="small" 
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </>
                )}
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );

  const renderDataManagement = () => (
    <Box>
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            <DeleteSweep sx={{ mr: 1, verticalAlign: 'middle' }} />
            データ管理
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              全ての注文データとパトロンデータを削除します
            </Typography>
            <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
              ⚠️ この操作は取り消すことができません
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteSweep />}
            onClick={() => setResetDialogOpen(true)}
            disabled={resetAllMutation.isPending}
            size="large"
          >
            {resetAllMutation.isPending ? 'リセット中...' : '全データリセット'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );

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
            <AdminPanelSettings sx={{ mr: 1, verticalAlign: 'middle' }} />
            管理者ページ
          </Typography>

          <Tabs 
            value={tabValue} 
            onChange={(_, newValue) => setTabValue(newValue)} 
            sx={{ mb: 3 }}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab label="メニュー管理" />
            <Tab label="カテゴリー管理" />
            <Tab label="ブレンド管理" />
            <Tab label="データ管理" />
          </Tabs>

          {tabValue === 0 && renderMenuManagement()}
          {tabValue === 1 && renderCategoryManagement()}
          {tabValue === 2 && renderBlendManagement()}
          {tabValue === 3 && renderDataManagement()}
        </Container>
      </Box>

      {/* Reset confirmation dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main', fontWeight: 600 }}>
          <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
          データリセットの確認
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            全ての注文データとパトロンデータを削除します。
          </Typography>
          <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
            この操作は取り消すことができません。本当に実行しますか？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleResetAll}
            color="error"
            variant="contained"
            disabled={resetAllMutation.isPending}
          >
            {resetAllMutation.isPending ? 'リセット中...' : 'リセット実行'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button - shows different button based on selected tab */}
      {tabValue >= 0 && tabValue <= 2 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
        >
          <Fab
            color="primary"
            aria-label="add"
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 16,
              zIndex: 1000,
            }}
            onClick={() => {
              if (tabValue === 0) setAddItemDrawerOpen(true);
              else if (tabValue === 1) setAddCategoryDrawerOpen(true);
              else if (tabValue === 2) setAddBlendDrawerOpen(true);
            }}
          >
            {tabValue === 0 && <Restaurant />}
            {tabValue === 1 && <Category />}
            {tabValue === 2 && <LocalBar />}
          </Fab>
        </motion.div>
      )}

      {/* Add Menu Item Drawer */}
      <Drawer
        anchor="right"
        open={addItemDrawerOpen}
        onClose={() => setAddItemDrawerOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 } },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            新しいメニューアイテムを追加
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <TextField
                label="メニュー名 *"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                fullWidth
                size="small"
                required
                error={!newItem.name}
                helperText={!newItem.name ? '必須項目です' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="価格 *"
                type="number"
                value={newItem.price}
                onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})}
                fullWidth
                size="small"
                required
                error={newItem.price <= 0}
                helperText={newItem.price <= 0 ? '0より大きい値を入力してください' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small" required error={!newItem.categoryId}>
                <InputLabel>カテゴリー *</InputLabel>
                <Select
                  value={newItem.categoryId}
                  onChange={(e) => setNewItem({...newItem, categoryId: e.target.value})}
                >
                  {categories?.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </Select>
                {!newItem.categoryId && (
                  <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                    必須項目です
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="説明"
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                fullWidth
                size="small"
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="レシピ・作り方"
                value={newItem.recipe}
                onChange={(e) => setNewItem({...newItem, recipe: e.target.value})}
                fullWidth
                size="small"
                multiline
                rows={3}
                placeholder="例: ウイスキー30ml、炭酸水適量、レモン1切れ"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>ブレンド（任意）</InputLabel>
                <Select
                  multiple
                  value={newItem.availableBlends}
                  onChange={(e) => setNewItem({...newItem, availableBlends: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value})}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const blend = blends?.find(b => b.id === value);
                        return (
                          <Chip key={value} label={blend?.name || value} size="small" />
                        );
                      })}
                    </Box>
                  )}
                >
                  {blends?.filter(blend => blend.isActive).map((blend) => (
                    <MenuItem key={blend.id} value={blend.id}>
                      {blend.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 3 }}>
            <Button onClick={() => setAddItemDrawerOpen(false)}>
              キャンセル
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateItem}
              disabled={createItemMutation.isPending}
            >
              {createItemMutation.isPending ? '作成中...' : '追加'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Add Category Drawer */}
      <Drawer
        anchor="right"
        open={addCategoryDrawerOpen}
        onClose={() => setAddCategoryDrawerOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 } },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            新しいカテゴリーを追加
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <TextField
                label="カテゴリー名 *"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                fullWidth
                size="small"
                required
                error={!newCategory.name}
                helperText={!newCategory.name ? '必須項目です' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newCategory.visible}
                    onChange={(e) => setNewCategory({...newCategory, visible: e.target.checked})}
                  />
                }
                label="表示する"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="説明"
                value={newCategory.description}
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                fullWidth
                size="small"
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="画像URL"
                value={newCategory.imageUrl}
                onChange={(e) => setNewCategory({...newCategory, imageUrl: e.target.value})}
                fullWidth
                size="small"
                placeholder="https://example.com/image.jpg"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 3 }}>
            <Button onClick={() => setAddCategoryDrawerOpen(false)}>
              キャンセル
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateCategory}
              disabled={createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? '作成中...' : '追加'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Add Blend Drawer */}
      <Drawer
        anchor="right"
        open={addBlendDrawerOpen}
        onClose={() => setAddBlendDrawerOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 } },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            新しいブレンドを追加
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <TextField
                label="ブレンド名 *"
                value={newBlend.name}
                onChange={(e) => setNewBlend({...newBlend, name: e.target.value})}
                fullWidth
                size="small"
                required
                error={!newBlend.name}
                helperText={!newBlend.name ? '必須項目です' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newBlend.isActive}
                    onChange={(e) => setNewBlend({...newBlend, isActive: e.target.checked})}
                  />
                }
                label="表示する"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="説明"
                value={newBlend.description}
                onChange={(e) => setNewBlend({...newBlend, description: e.target.value})}
                fullWidth
                size="small"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 3 }}>
            <Button onClick={() => setAddBlendDrawerOpen(false)}>
              キャンセル
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateBlend}
              disabled={createBlendMutation.isPending}
            >
              {createBlendMutation.isPending ? '作成中...' : '追加'}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </motion.div>
  );
};

export default AdminPage;