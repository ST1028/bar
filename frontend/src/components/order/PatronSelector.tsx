import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Button,
  Box,
} from '@mui/material';
import { Person, PersonAdd } from '@mui/icons-material';
import { motion } from 'framer-motion';

import { Patron } from '../../types';
import { useCartStore } from '../../stores/cart';

interface PatronSelectorProps {
  open: boolean;
  onClose: () => void;
  patrons: Patron[];
}

const PatronSelector = ({ open, onClose, patrons }: PatronSelectorProps) => {
  const { setSelectedPatronId, selectedPatronId } = useCartStore();

  const handleSelectPatron = (patronId: string) => {
    setSelectedPatronId(patronId);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>注文者を選択してください</DialogTitle>
      <DialogContent sx={{ px: 0 }}>
        {patrons.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, px: 3 }}>
            <PersonAdd sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => {
                onClose();
                // Navigate to patron management page
                window.location.href = '/patrons';
              }}
            >
              注文者を追加
            </Button>
          </Box>
        ) : (
          <List sx={{ pt: 0 }}>
            {patrons.map((patron, index) => (
              <motion.div
                key={patron.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleSelectPatron(patron.id)}
                    selected={selectedPatronId === patron.id}
                    sx={{
                      '&.Mui-selected': {
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        '&:hover': {
                          bgcolor: 'primary.main',
                        },
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Person color={selectedPatronId === patron.id ? 'inherit' : 'primary'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={patron.name}
                      secondary={`登録日: ${new Date(patron.createdAt).toLocaleDateString('ja-JP')}`}
                    />
                  </ListItemButton>
                </ListItem>
              </motion.div>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PatronSelector;