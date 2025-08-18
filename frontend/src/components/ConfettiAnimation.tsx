import { useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '@lordicon/react';
import confettiAnimation from '../icons/wired-outline-1103-confetti-hover-pinch.json';

interface ConfettiAnimationProps {
  open: boolean;
  onClose: () => void;
}

const ConfettiAnimation = ({ open, onClose }: ConfettiAnimationProps) => {
  const playerRef = useRef<Player>(null);

  useEffect(() => {
    if (open && playerRef.current) {
      playerRef.current.playFromBeginning();
      
      // Auto close after animation duration
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: 9999,
            pointerEvents: 'auto'
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ 
              duration: 0.4, 
              ease: "easeOut",
              delay: 0.1
            }}
            style={{ position: 'relative' }}
          >
            <Box
              sx={{
                textAlign: 'center',
                bgcolor: 'background.paper',
                borderRadius: 4,
                p: 4,
                maxWidth: 400,
                mx: 2,
                boxShadow: 24
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeInOut",
                  repeat: 1
                }}
              >
                <Player
                  ref={playerRef}
                  icon={confettiAnimation}
                  size={120}
                  colorize="#81C784"
                />
              </motion.div>
              
              <Typography 
                variant="h5" 
                sx={{ 
                  mt: 2, 
                  fontWeight: 600, 
                  color: 'primary.main' 
                }}
              >
                注文完了！
              </Typography>
              
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ mt: 1 }}
              >
                ご注文を受け付けました
              </Typography>
            </Box>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfettiAnimation;