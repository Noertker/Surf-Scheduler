import { create } from 'zustand';

interface ThemeState {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'light',
  toggleTheme: () =>
    set((s) => ({ mode: s.mode === 'dark' ? 'light' : 'dark' })),
}));
