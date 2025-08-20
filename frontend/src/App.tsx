import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import { Amplify } from 'aws-amplify';
import { getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

import { amplifyConfig } from './config/amplify';
import { useAuthStore } from './stores/auth';
import AuthenticatedApp from './components/AuthenticatedApp';
import LoginPage from './pages/LoginPage';
import LoadingScreen from './components/LoadingScreen';
import PWAInstallPrompt from './components/PWAInstallPrompt';

Amplify.configure(amplifyConfig);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#81C784',     // Soft green
      light: '#A5D6A7',
      dark: '#66BB6A',
    },
    secondary: {
      main: '#90CAF9',     // Soft blue
      light: '#BBDEFB',
      dark: '#64B5F6',
    },
    background: {
      default: '#F8F9FA',  // Very light gray
      paper: '#FFFFFF',
    },
    success: {
      main: '#A5D6A7',     // Soft green
    },
    warning: {
      main: '#FFCC80',     // Soft orange
    },
    error: {
      main: '#FFAB91',     // Soft coral
    },
    info: {
      main: '#90CAF9',     // Soft blue
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, "Helvetica Neue", Helvetica, Arial, sans-serif',
    h1: {
      fontWeight: 300,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 300,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 400,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 300,
      letterSpacing: '-0.005em',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 400,
      letterSpacing: 0,
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 500,
      letterSpacing: 0,
      lineHeight: 1.5,
    },
    body1: {
      fontWeight: 400,
      letterSpacing: 0,
      lineHeight: 1.6,
    },
    body2: {
      fontWeight: 400,
      letterSpacing: 0,
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 500,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
});

function App() {
  const { setUser, setLoading, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuthState();
    registerServiceWorker();

    // Listen to Amplify Hub events for authentication changes
    const hubListenerCancelToken = Hub.listen('auth', (data) => {
      const { payload } = data;
      console.log('🎧 Amplify Hub event:', payload.event);
      
      switch (payload.event) {
        case 'signedIn':
          console.log('✅ User signed in via Hub');
          checkAuthState();
          break;
        case 'signedOut':
          console.log('👋 User signed out via Hub');
          setUser(null);
          break;
        case 'tokenRefresh':
          console.log('🔄 Token refreshed via Hub');
          checkAuthState();
          break;
        default:
          break;
      }
    });

    return () => {
      hubListenerCancelToken();
    };
  }, []);

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New content available! Please refresh.');
                // You could show a notification here
              }
            });
          }
        });
      } catch (error) {
        console.log('❌ Service Worker registration failed:', error);
      }
    }
  };

  const checkAuthState = async () => {
    console.log('🔍 Checking authentication state...');
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      console.log('✅ User authenticated:', currentUser);
      setUser({
        sub: currentUser.userId,
        email: currentUser.signInDetails?.loginId || '',
        groups: [], // Will be populated from token claims if needed
      });
    } catch (error) {
      console.log('❌ Not authenticated:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
              }
            />
            <Route
              path="/*"
              element={
                isAuthenticated ? (
                  <AuthenticatedApp />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </Router>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: theme.palette.background.paper,
              color: theme.palette.text.primary,
            },
          }}
        />
        <PWAInstallPrompt />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
