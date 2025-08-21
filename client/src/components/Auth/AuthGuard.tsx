import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../UI/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'teacher' | 'admin';
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login with return URL
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && user?.accountType !== requiredRole) {
    // If admin is required but user is teacher/student, redirect to dashboard
    if (requiredRole === 'admin' && user?.accountType !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    
    // If teacher is required but user is student, redirect to dashboard
    if (requiredRole === 'teacher' && user?.accountType === 'student') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default AuthGuard;