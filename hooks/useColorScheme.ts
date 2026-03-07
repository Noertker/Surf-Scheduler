import { useThemeStore } from './useThemeStore';

export const useColorScheme = (): 'light' | 'dark' => {
  return useThemeStore((s) => s.mode);
};
