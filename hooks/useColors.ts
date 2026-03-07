import { darkColors, lightColors, ThemeColors } from '@/constants/theme';
import { useThemeStore } from './useThemeStore';

export function useColors(): ThemeColors {
  const mode = useThemeStore((s) => s.mode);
  return mode === 'dark' ? darkColors : lightColors;
}
