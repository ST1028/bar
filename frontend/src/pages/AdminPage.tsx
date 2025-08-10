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
} from '@mui/material';
import { AdminPanelSettings, DeleteSweep, Warning } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import { adminAPI } from '../services/api';
import { useAuthStore } from '../stores/auth';

const AdminPage = () => {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const resetAllMutation = useMutation({
    mutationFn: adminAPI.resetAllOrders,
    onSuccess: (data) => {
      toast.success(`${data.deletedCount}件のデータをリセットしました`);
      setResetDialogOpen(false);
      // Invalidate all queries to refresh the UI
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'リセットに失敗しました');
    },
  });

  const handleResetAll = () => {
    resetAllMutation.mutate();
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

          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
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

          {/* Future admin features will be added here */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                今後の機能
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                • メニューの追加・編集・削除<br />
                • カテゴリー管理<br />
                • 注文状況の管理<br />
                • レポート機能
              </Typography>
            </CardContent>
          </Card>
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