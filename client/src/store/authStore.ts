import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState } from '../types';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  verifyToken: () => Promise<void>;
  enable2FA: () => Promise<{ qrCode: string; secret: string }>;
  verify2FA: (code: string) => Promise<void>;
  disable2FA: (code: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

interface RegisterData {
  name: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  accountType: 'student' | 'teacher';
  subjects?: string[];
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(email, password);
          const { user, token } = response.data;
          
          // Set token in axios defaults for future requests
          authApi.setAuthToken(token);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          toast.success(`Welcome back, ${user.name}!`);
        } catch (error: any) {
          set({ isLoading: false });
          const errorMessage = error.response?.data?.error || 'Login failed';
          toast.error(errorMessage);
          throw error;
        }
      },

      logout: () => {
        // Clear token from axios defaults
        authApi.clearAuthToken();
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        
        // Clear persisted storage
        localStorage.removeItem('auth-storage');
        
        toast.success('Logged out successfully');
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(userData);
          const { user, token } = response.data;
          
          // Set token in axios defaults for future requests
          authApi.setAuthToken(token);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          toast.success(`Welcome to Alumet, ${user.name}!`);
        } catch (error: any) {
          set({ isLoading: false });
          const errorMessage = error.response?.data?.error || 'Registration failed';
          toast.error(errorMessage);
          throw error;
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      verifyToken: async () => {
        const token = get().token;
        if (!token) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          // Set token in axios defaults
          authApi.setAuthToken(token);
          
          const response = await authApi.verifyToken();
          const { user } = response.data;
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Token is invalid, logout
          console.error('Token verification failed:', error);
          get().logout();
        }
      },

      enable2FA: async () => {
        try {
          const response = await authApi.enable2FA();
          return response.data;
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to enable 2FA';
          toast.error(errorMessage);
          throw error;
        }
      },

      verify2FA: async (code: string) => {
        try {
          const response = await authApi.verify2FA(code);
          const { user } = response.data;
          
          set({ user });
          toast.success('2FA enabled successfully');
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Invalid verification code';
          toast.error(errorMessage);
          throw error;
        }
      },

      disable2FA: async (code: string) => {
        try {
          const response = await authApi.disable2FA(code);
          const { user } = response.data;
          
          set({ user });
          toast.success('2FA disabled successfully');
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to disable 2FA';
          toast.error(errorMessage);
          throw error;
        }
      },

      resetPassword: async (email: string) => {
        try {
          await authApi.resetPassword(email);
          toast.success('Password reset email sent');
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to send reset email';
          toast.error(errorMessage);
          throw error;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        try {
          await authApi.changePassword(currentPassword, newPassword);
          toast.success('Password changed successfully');
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to change password';
          toast.error(errorMessage);
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);