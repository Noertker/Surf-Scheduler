import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type ThemePreference = 'light' | 'dark' | 'system';
export type CalendarViewMode = 'timeline' | 'grid';

interface ThemeState {
  preference: ThemePreference;
  /** The resolved mode after applying system preference */
  mode: 'light' | 'dark';
  calendarViewMode: CalendarViewMode;
  setPreference: (pref: ThemePreference) => void;
  setCalendarViewMode: (mode: CalendarViewMode) => void;
  /** @deprecated Use setPreference instead */
  toggleTheme: () => void;
  initialize: () => Promise<void>;
}

const THEME_KEY = 'kairo_theme_preference';
const CAL_VIEW_KEY = 'kairo_calendar_view';

function resolveMode(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'system') {
    const os = Appearance.getColorScheme();
    return os === 'dark' ? 'dark' : 'light';
  }
  return pref;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: 'system',
  mode: resolveMode('system'),
  calendarViewMode: 'timeline',

  setPreference: (pref) => {
    set({ preference: pref, mode: resolveMode(pref) });
    AsyncStorage.setItem(THEME_KEY, pref).catch(() => {});
  },

  setCalendarViewMode: (mode) => {
    set({ calendarViewMode: mode });
    AsyncStorage.setItem(CAL_VIEW_KEY, mode).catch(() => {});
  },

  toggleTheme: () => {
    const current = get().mode;
    const next = current === 'dark' ? 'light' : 'dark';
    get().setPreference(next);
  },

  initialize: async () => {
    try {
      const [savedTheme, savedCalView] = await Promise.all([
        AsyncStorage.getItem(THEME_KEY),
        AsyncStorage.getItem(CAL_VIEW_KEY),
      ]);
      const updates: Partial<ThemeState> = {};
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
        updates.preference = savedTheme;
        updates.mode = resolveMode(savedTheme);
      }
      if (savedCalView === 'timeline' || savedCalView === 'grid') {
        updates.calendarViewMode = savedCalView;
      }
      if (Object.keys(updates).length > 0) {
        set(updates);
      }
    } catch {}
  },
}));

// Listen for OS appearance changes and update if preference is 'system'
Appearance.addChangeListener(({ colorScheme }) => {
  const { preference } = useThemeStore.getState();
  if (preference === 'system') {
    useThemeStore.setState({ mode: colorScheme === 'dark' ? 'dark' : 'light' });
  }
});
