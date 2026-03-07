import { create } from 'zustand';
import { SpotPreference } from '@/types/spot';
import {
  fetchSpotPreferences,
  upsertSpotPreference,
} from '@/services/spotPreferences';

interface PreferenceState {
  preferences: SpotPreference[];
  loading: boolean;
  error: string | null;
  fetchPreferences: () => Promise<void>;
  savePreference: (
    spotId: string,
    tideMin: number,
    tideMax: number,
    enabled: boolean
  ) => Promise<void>;
  getPreferenceForSpot: (spotId: string) => SpotPreference | undefined;
}

export const usePreferenceStore = create<PreferenceState>((set, get) => ({
  preferences: [],
  loading: false,
  error: null,

  fetchPreferences: async () => {
    set({ loading: true, error: null });
    try {
      const prefs = await fetchSpotPreferences(null);
      set({ preferences: prefs, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  savePreference: async (spotId, tideMin, tideMax, enabled) => {
    try {
      const saved = await upsertSpotPreference({
        user_id: null,
        spot_id: spotId,
        tide_min_ft: tideMin,
        tide_max_ft: tideMax,
        enabled,
      });
      set((state) => ({
        preferences: [
          ...state.preferences.filter((p) => p.spot_id !== spotId),
          saved,
        ],
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  getPreferenceForSpot: (spotId) =>
    get().preferences.find((p) => p.spot_id === spotId),
}));
