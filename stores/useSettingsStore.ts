import { create } from 'zustand';
import { DEFAULT_DAY_START, DEFAULT_DAY_END } from '@/utils/tideWindows';
import { fetchUserSettings, upsertUserSettings } from '@/services/userSettings';
import { getUserId } from '@/services/supabase';

interface SettingsState {
  dayStartHour: number;
  dayEndHour: number;
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  saveTimeWindow: (startHour: number, endHour: number) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  dayStartHour: DEFAULT_DAY_START,
  dayEndHour: DEFAULT_DAY_END,
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const settings = await fetchUserSettings();
      if (settings) {
        set({
          dayStartHour: settings.day_start_hour,
          dayEndHour: settings.day_end_hour,
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  saveTimeWindow: async (startHour, endHour) => {
    try {
      const finalStart = Math.min(startHour, endHour);
      const finalEnd = Math.max(startHour, endHour);
      await upsertUserSettings({
        user_id: getUserId(),
        day_start_hour: finalStart,
        day_end_hour: finalEnd,
      });
      set({ dayStartHour: finalStart, dayEndHour: finalEnd });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
