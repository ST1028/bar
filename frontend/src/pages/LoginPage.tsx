import { Box, Container, Paper, Typography } from '@mui/material';
import { Authenticator } from '@aws-amplify/ui-react';
import { motion } from 'framer-motion';
import '@aws-amplify/ui-react/styles.css';

const LoginPage = () => {
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
              🍺 Bar Order System
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              ログインしてご注文を開始してください
            </Typography>
            
            <Authenticator
              hideSignUp={false}
              components={{
                Header() {
                  return null;
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
                signUp: {
                  email: {
                    placeholder: 'メールアドレス',
                  },
                  password: {
                    placeholder: 'パスワード（8文字以上）',
                  },
                  confirm_password: {
                    placeholder: 'パスワード（確認用）',
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