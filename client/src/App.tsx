import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

// Components
import Layout from './components/Layout/Layout';
import AuthGuard from './components/Auth/AuthGuard';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Pages
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import AlumetPage from './pages/Alumet/AlumetPage';
import AlumetListPage from './pages/Alumet/AlumetListPage';
import FlashcardsPage from './pages/Flashcards/FlashcardsPage';
import FlashcardSetPage from './pages/Flashcards/FlashcardSetPage';
import MessagesPage from './pages/Messages/MessagesPage';
import FilesPage from './pages/Files/FilesPage';
import HomeworkPage from './pages/Homework/HomeworkPage';
import MindmapPage from './pages/Mindmap/MindmapPage';
import ProfilePage from './pages/Profile/ProfilePage';
import SettingsPage from './pages/Settings/SettingsPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';

// Hooks
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  const { isAuthenticated, isLoading, verifyToken } = useAuthStore();
  const { mode } = useThemeStore();

  useEffect(() => {
    // Apply theme class to document
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route 
              path="/auth/login" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
              } 
            />
            <Route 
              path="/auth/register" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
              } 
            />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <AuthGuard>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </AuthGuard>
              }
            />
            
            <Route
              path="/alumet"
              element={
                <AuthGuard>
                  <Layout>
                    <AlumetListPage />
                  </Layout>
                </AuthGuard>
              }
            />
            
            <Route
              path="/alumet/:id"
              element={
                <AuthGuard>
                  <Layout>
                    <AlumetPage />
                  </Layout>
                </AuthGuard>
              }
            />
            
            <Route
              path="/flashcards"
              element={
                <AuthGuard>
                  <Layout>
                    <FlashcardsPage />
                  </Layout>
                </AuthGuard>
              }
            />
            
            <Route
              path="/flashcards/:id"
              element={
                <AuthGuard>
                  <Layout>
                    <FlashcardSetPage />
                  </Layout>
                </AuthGuard>
              }
            />
            
            <Route
              path="/messages"
              element={
                <AuthGuard>
                  <Layout>
                    <MessagesPage />
                  </Layout>
                </AuthGuard>
              }
            />
            
            <Route
              path="/files"
              element={
                <AuthGuard>
                  <Layout>
                    <FilesPage />
                  </Layout>
                </AuthGuard>
              }
            />
            
            <Route
              path="/homework"
              element={
                <AuthGuard>
                  <Layout>
                    <HomeworkPage />
                  </Layout>
                </AuthGuard>
              }
            />
            
            <Route
              path="/mindmaps"
              element={
                <AuthGuard>
                  <Layout>
                    <MindmapPage />
                  </Layout>
                </AuthGuard>
              }
            />
            
            <Route
              path="/profile"
              element={
                <AuthGuard>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </AuthGuard>
              }
            />
            
            <Route
              path="/settings"
              element={
                <AuthGuard>
                  <Layout>
                    <SettingsPage />
                  </Layout>
                </AuthGuard>
              }
            />

            {/* 404 page */}
            <Route path="/404" element={<NotFoundPage />} />
            
            {/* Redirect unknown routes */}
            <Route 
              path="*" 
              element={<Navigate to="/404" replace />} 
            />
          </Routes>
        </div>
      </Router>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: mode === 'dark' ? '#374151' : '#ffffff',
            color: mode === 'dark' ? '#ffffff' : '#374151',
            border: mode === 'dark' ? '1px solid #4B5563' : '1px solid #E5E7EB',
          },
        }}
      />
      
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;