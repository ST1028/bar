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
} from '@mui/material';
import {
  AdminPanelSettings,
  DeleteSweep,
  Warning,
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  Category,
  Restaurant,
  Visibility,
  VisibilityOff,
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
  const [newItem, setNewItem] = useState({ name: '', description: '', recipe: '', price: 0, categoryId: '', availableBlends: [] as string[] });
  const [newCategory, setNewCategory] = useState({ name: '', description: '', visible: true });
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
      setNewItem({ name: '', description: '', recipe: '', price: 0, categoryId: '', availableBlends: [] });
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
      setNewCategory({ name: '', description: '', visible: true });
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
          
          {/* Add new menu item */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>新しいメニューアイテムを追加</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="メニュー名"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="価格"
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>カテゴリー</InputLabel>
                  <Select
                    value={newItem.categoryId}
                    onChange={(e) => setNewItem({...newItem, categoryId: e.target.value})}
                  >
                    {categories?.map(cat => (
                      <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                    ))}
                  </Select>
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
                  rows={2}
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
                  rows={2}
                  placeholder="例: ウイスキー30ml、炭酸水適量、レモン1切れ"
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateItem}
              disabled={createItemMutation.isPending}
            >
              {createItemMutation.isPending ? '作成中...' : 'メニュー追加'}
            </Button>
          </Box>

          {/* Menu items list */}
          <List>
            {menuItems?.map((item) => (
              <ListItem key={item.id} divider>
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
                      value={editingItem.description || ''}
                      onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      sx={{ mb: 1 }}
                      placeholder="説明"
                    />
                    <TextField
                      value={editingItem.recipe || ''}
                      onChange={(e) => setEditingItem({...editingItem, recipe: e.target.value})}
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      sx={{ mb: 2 }}
                      placeholder="レシピ・作り方"
                    />
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
                      secondary={`¥${item.price.toLocaleString()} - ${categories?.find(c => c.id === item.categoryId)?.name} ${item.description ? '- ' + item.description : ''}`}
                    />
                    <ListItemSecondaryAction>
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
          
          {/* Add new category */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>新しいカテゴリーを追加</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="カテゴリー名"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
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
                  rows={2}
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateCategory}
              disabled={createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? '作成中...' : 'カテゴリー追加'}
            </Button>
          </Box>

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
                      sx={{ mb: 2 }}
                      placeholder="説明"
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
          
          {/* Add new blend */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>新しいブレンドを追加</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="ブレンド名"
                  value={newBlend.name}
                  onChange={(e) => setNewBlend({...newBlend, name: e.target.value})}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
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
                  rows={2}
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateBlend}
              disabled={createBlendMutation.isPending}
            >
              {createBlendMutation.isPending ? '作成中...' : 'ブレンド追加'}
            </Button>
          </Box>

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

          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
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
    </motion.div>
  );
};

export default AdminPage;