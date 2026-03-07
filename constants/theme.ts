/**
 * Centralized design tokens for light and dark themes.
 * Components use the useColors() hook to get the active palette.
 */

export const darkColors = {
  // Backgrounds
  bg: '#0a0e14',
  card: '#0f172a',
  cardAlt: '#111827',
  cardHighlight: '#0c1f30',

  // Borders
  border: '#1e293b',
  borderLight: '#334155',

  // Primary (cyan)
  primary: '#0ea5e9',
  primaryDark: '#0c1f30',

  // Accents
  accent: '#00ff88',
  accentMuted: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
  errorDark: '#ef4444',

  // Text hierarchy (brightest → faintest)
  text: '#e2e8f0',
  textMuted: '#cbd5e1',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  textDim: '#475569',
  textFaint: '#334155',

  // Chart colors
  chartTide: '#0ea5e9',
  chartWind: '#f87171',
  chartSwell: '#06b6d4',
  chartGrid: '#1e293b',
  chartAxis: '#64748b',
  chartLabelBg: 'rgba(15, 23, 42, 0.9)',
  crosshairStroke: 'rgba(255, 255, 255, 0.2)',
  crosshairLabelText: '#fff',

  // Overlays
  overlayDark: 'rgba(0, 0, 0, 0.6)',
  windowTint: 'rgba(0, 255, 136, 0.06)',
  todayTint: 'rgba(14, 165, 233, 0.08)',
  tidePrefFill: 'rgba(0, 255, 136, 0.12)',
  highlightFill: 'rgba(14, 165, 233, 0.15)',
};

export type ThemeColors = typeof darkColors;

export const lightColors: ThemeColors = {
  // Backgrounds
  bg: '#f8fafc',
  card: '#ffffff',
  cardAlt: '#f1f5f9',
  cardHighlight: '#e0f2fe',

  // Borders
  border: '#e2e8f0',
  borderLight: '#cbd5e1',

  // Primary (cyan — slightly darker for contrast on white)
  primary: '#0284c7',
  primaryDark: '#e0f2fe',

  // Accents
  accent: '#059669',
  accentMuted: '#10b981',
  warning: '#d97706',
  error: '#dc2626',
  errorDark: '#b91c1c',

  // Text hierarchy (darkest → faintest)
  text: '#0f172a',
  textMuted: '#1e293b',
  textSecondary: '#475569',
  textTertiary: '#64748b',
  textDim: '#94a3b8',
  textFaint: '#cbd5e1',

  // Chart colors
  chartTide: '#0284c7',
  chartWind: '#dc2626',
  chartSwell: '#0891b2',
  chartGrid: '#e2e8f0',
  chartAxis: '#64748b',
  chartLabelBg: 'rgba(255, 255, 255, 0.9)',
  crosshairStroke: 'rgba(0, 0, 0, 0.2)',
  crosshairLabelText: '#0f172a',

  // Overlays
  overlayDark: 'rgba(0, 0, 0, 0.4)',
  windowTint: 'rgba(5, 150, 105, 0.06)',
  todayTint: 'rgba(2, 132, 199, 0.08)',
  tidePrefFill: 'rgba(5, 150, 105, 0.12)',
  highlightFill: 'rgba(2, 132, 199, 0.15)',
};

/** @deprecated Use useColors() hook instead. Kept for backward compat during migration. */
export const colors = darkColors;
