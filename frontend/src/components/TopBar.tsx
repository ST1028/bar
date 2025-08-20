import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Avatar, Box } from '@mui/material';
import { AccountCircle, ExitToApp } from '@mui/icons-material';
import { useState } from 'react';
import { signOut } from 'aws-amplify/auth';
import { useAuthStore } from '../stores/auth';
import toast from 'react-hot-toast';

const TopBar = () => {
  const { user, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      logout();
      toast.success('ログアウトしました');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('ログアウトに失敗しました');
    }
    handleClose();
  };

  return (
    <AppBar position="fixed" sx={{ 
      zIndex: (theme) => theme.zIndex.drawer + 1,
      bgcolor: 'rgba(255, 255, 255, 0.95)',
      color: 'black',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      backdropFilter: 'saturate(180%) blur(20px)',
      height: 44, // iOS App風の高さに調整
      minHeight: 44
    }}>
      <Toolbar sx={{ 
        minHeight: '44px !important',
        height: 44,
        px: 2
      }}>
        {/* 左側のスペーサー */}
        <Box sx={{ display: 'flex', alignItems: 'center', width: 48 }}>
          <Avatar 
            src="https://bar-file.s3.ap-northeast-1.amazonaws.com/bar-icon.png"
            alt="SF BAR Logo"
            sx={{ 
              width: 24, 
              height: 24, 
              bgcolor: 'primary.light'
            }}
          />
        </Box>
        
        {/* 中央のブランド名 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
          <Typography variant="h6" component="div" sx={{
            fontWeight: 300,
            letterSpacing: '0.05em',
            fontSize: '18px'
          }}>
            SF BAR
          </Typography>
        </Box>
        
        {/* 右側のユーザーメニュー */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 48 }}>
          <IconButton
            size="small"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountCircle sx={{ fontSize: 24 }} />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem disabled>
              {user?.email}
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} />
              ログアウト
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;