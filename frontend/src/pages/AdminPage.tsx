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

import { adminAPI, menuAPI } from '../services/api';
import type { MenuItem as MenuItemType, MenuCategory } from '../types';
import { useAuthStore } from '../stores/auth';

const AdminPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [newItem, setNewItem] = useState({ name: '', description: '', price: 0, categoryId: '' });
  const [newCategory, setNewCategory] = useState({ name: '', description: '', visible: true });
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
      setNewItem({ name: '', description: '', price: 0, categoryId: '', imageUrl: '' });
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
    updateItemMutation.mutate(editingItem);
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
    updateCategoryMutation.mutate(editingCategory);
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
            メニューアイテム一覧（閲覧のみ）
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
            ⚠️ メニューの追加・編集・削除機能は後で実装されます
          </Typography>
          
          {/* Menu items list */}
          <List>
            {menuItems?.map((item) => (
              <ListItem key={item.id} divider>
                <ListItemText
                  primary={item.name}
                  secondary={`¥${item.price.toLocaleString()} - ${categories?.find(c => c.id === item.categoryId)?.name} ${item.description ? '- ' + item.description : ''}`}
                />
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
            カテゴリー一覧（閲覧のみ）
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
            ⚠️ カテゴリーの追加・編集・削除機能は後で実装されます
          </Typography>
          
          {/* Categories list */}
          <List>
            {categories?.map((category) => (
              <ListItem key={category.id} divider>
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
            <Tab label="データ管理" />
          </Tabs>

          {tabValue === 0 && renderMenuManagement()}
          {tabValue === 1 && renderCategoryManagement()}
          {tabValue === 2 && renderDataManagement()}
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