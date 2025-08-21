import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeState } from '../types';

interface ThemeStore extends ThemeState {
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  toggleMode: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

const getEffectiveTheme = (mode: 'light' | 'dark' | 'system'): 'light' | 'dark' => {
  return mode === 'system' ? getSystemTheme() : mode;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'system',
      primaryColor: '#3b82f6', // blue-500
      fontSize: 'medium',
      reducedMotion: false,

      setMode: (mode) => {
        set({ mode });
        
        // Apply theme immediately
        const effectiveTheme = getEffectiveTheme(mode);
        document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');
        
        // Listen to system theme changes if mode is 'system'
        if (mode === 'system') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = () => {
            const systemTheme = getSystemTheme();
            document.documentElement.classList.toggle('dark', systemTheme === 'dark');
          };
          
          mediaQuery.addEventListener('change', handleChange);
          
          // Cleanup previous listeners
          return () => mediaQuery.removeEventListener('change', handleChange);
        }
      },

      setPrimaryColor: (color) => {
        set({ primaryColor: color });
        
        // Update CSS custom properties
        document.documentElement.style.setProperty('--color-primary', color);
      },

      setFontSize: (size) => {
        set({ fontSize: size });
        
        // Update CSS class
        document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg');
        const sizeClass = {
          small: 'text-sm',
          medium: 'text-base',
          large: 'text-lg'
        }[size];
        document.documentElement.classList.add(sizeClass);
      },

      setReducedMotion: (reducedMotion) => {
        set({ reducedMotion });
        
        // Update CSS class
        document.documentElement.classList.toggle('reduce-motion', reducedMotion);
      },

      toggleMode: () => {
        const currentMode = get().mode;
        let newMode: 'light' | 'dark' | 'system';
        
        if (currentMode === 'light') {
          newMode = 'dark';
        } else if (currentMode === 'dark') {
          newMode = 'system';
        } else {
          newMode = 'light';
        }
        
        get().setMode(newMode);
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

// Initialize theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('theme-storage');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      const effectiveTheme = getEffectiveTheme(state.mode);
      document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');
      
      // Apply other theme settings
      if (state.primaryColor) {
        document.documentElement.style.setProperty('--color-primary', state.primaryColor);
      }
      
      if (state.fontSize) {
        const sizeClass = {
          small: 'text-sm',
          medium: 'text-base',
          large: 'text-lg'
        }[state.fontSize];
        document.documentElement.classList.add(sizeClass);
      }
      
      if (state.reducedMotion) {
        document.documentElement.classList.add('reduce-motion');
      }
    } catch (error) {
      console.error('Failed to parse theme storage:', error);
    }
  }
}