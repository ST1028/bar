import { useEffect } from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import { Authenticator } from '@aws-amplify/ui-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import '@aws-amplify/ui-react/styles.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    console.log('🔄 LoginPage: Authentication state changed:', isAuthenticated);
    if (isAuthenticated) {
      console.log('🎯 LoginPage: User is authenticated, redirecting to /');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 4,
              borderRadius: 3,
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom>
              Bar
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              ログインしてご注文を開始してください
            </Typography>
            
            <Authenticator
              hideSignUp={true}
              components={{
                Header() {
                  return null;
                },
                ResetPassword() {
                  return <div style={{ display: 'none' }}></div>;
                },
                ForgotPassword() {
                  return <div style={{ display: 'none' }}></div>;
                },
              }}
              formFields={{
                signIn: {
                  username: {
                    placeholder: 'メールアドレス',
                  },
                  password: {
                    placeholder: 'パスワード',
                  },
                },
              }}
            />
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default LoginPage;