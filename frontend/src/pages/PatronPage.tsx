import { useState, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Player } from '@lordicon/react';

import { patronAPI } from '../services/api';
import type { Patron } from '../types';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorMessage from '../components/ErrorMessage';
import avatarPlusAnimation from '../icons/wired-outline-307-avatar-icon-calm-plus-hover-click.json';
import editAnimation from '../icons/wired-outline-35-edit-hover-line.json';

const PatronPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatron, setEditingPatron] = useState<Patron | null>(null);
  const [patronName, setPatronName] = useState('');
  const queryClient = useQueryClient();
  const fabIconRef = useRef<Player>(null);
  const emptyStateIconRef = useRef<Player>(null);
  const editIconRefs = useRef<Record<string, Player | null>>({});

  const { data: patrons, isLoading, error } = useQuery({
    queryKey: ['patrons'],
    queryFn: patronAPI.getPatrons,
  });

  const createPatronMutation = useMutation({
    mutationFn: patronAPI.createPatron,
    onSuccess: () => {
      toast.success('注文者を追加しました');
      queryClient.invalidateQueries({ queryKey: ['patrons'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '注文者の追加に失敗しました');
    },
  });

  const updatePatronMutation = useMutation({
    mutationFn: ({ patronId, name }: { patronId: string; name: string }) =>
      patronAPI.updatePatron(patronId, name),
    onSuccess: () => {
      toast.success('注文者名を更新しました');
      queryClient.invalidateQueries({ queryKey: ['patrons'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '注文者名の更新に失敗しました');
    },
  });

  const handleOpenDialog = (patron?: Patron) => {
    if (patron) {
      setEditingPatron(patron);
      setPatronName(patron.name);
    } else {
      setEditingPatron(null);
      setPatronName('');
      // Trigger animation when opening add dialog
      if (fabIconRef.current) {
        fabIconRef.current.playFromBeginning();
      }
      if (emptyStateIconRef.current) {
        emptyStateIconRef.current.playFromBeginning();
      }
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPatron(null);
    setPatronName('');
  };

  const handleSubmit = () => {
    if (!patronName.trim()) return;

    if (editingPatron) {
      updatePatronMutation.mutate({
        patronId: editingPatron.id,
        name: patronName.trim(),
      });
    } else {
      createPatronMutation.mutate(patronName.trim());
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage message="注文者の読み込みに失敗しました" />;

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
            注文者管理
          </Typography>

          {!patrons || patrons.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Player
                ref={emptyStateIconRef}
                icon={avatarPlusAnimation}
                size={64}
                colorize="#9e9e9e"
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                注文者がいません
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                最初の注文者を追加してください
              </Typography>
              <Button
                variant="contained"
                startIcon={
                  <Player
                    icon={avatarPlusAnimation}
                    size={20}
                    colorize="#ffffff"
                  />
                }
                onClick={() => handleOpenDialog()}
                size="large"
              >
                注文者を追加
              </Button>
            </Box>
          ) : (
            <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
              <AnimatePresence>
                {patrons.map((patron, index) => (
                  <motion.div
                    key={patron.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <ListItem>
                      <ListItemText
                        primary={patron.name}
                        secondary={`登録日: ${new Date(patron.createdAt).toLocaleDateString('ja-JP')}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => {
                            if (editIconRefs.current[patron.id]) {
                              editIconRefs.current[patron.id]?.playFromBeginning();
                            }
                            handleOpenDialog(patron);
                          }}
                        >
                          <Player
                            ref={(ref) => {
                              if (ref) editIconRefs.current[patron.id] = ref;
                            }}
                            icon={editAnimation}
                            size={20}
                            colorize="#666666"
                          />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </motion.div>
                ))}
              </AnimatePresence>
            </List>
          )}

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Fab
              color="primary"
              aria-label="add patron"
              sx={{
                position: 'fixed',
                bottom: 80,
                right: 16,
              }}
              onClick={() => handleOpenDialog()}
            >
              <Player
                ref={fabIconRef}
                icon={avatarPlusAnimation}
                size={24}
                colorize="#ffffff"
              />
            </Fab>
          </motion.div>
        </Container>
      </Box>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPatron ? '注文者名を編集' : '新しい注文者を追加'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="注文者名"
            fullWidth
            variant="outlined"
            value={patronName}
            onChange={(e) => setPatronName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !patronName.trim() ||
              createPatronMutation.isPending ||
              updatePatronMutation.isPending
            }
          >
            {editingPatron ? '更新' : '追加'}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default PatronPage;