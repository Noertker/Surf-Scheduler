import { create } from 'zustand';
import { SwellReading, WindReading } from '@/types/conditions';
import { fetchSwellWithFallback, fetchWindWithFallback } from '@/services/forecasts';

interface ConditionsState {
  swell: SwellReading[];
  wind: WindReading[];
  loading: boolean;
  error: string | null;
  fetchConditions: (lat: number, lng: number) => Promise<void>;
}

export const useConditionsStore = create<ConditionsState>((set) => ({
  swell: [],
  wind: [],
  loading: false,
  error: null,

  fetchConditions: async (lat, lng) => {
    set({ loading: true, error: null });
    try {
      const [swell, wind] = await Promise.all([
        fetchSwellWithFallback(lat, lng, 16),
        fetchWindWithFallback(lat, lng, 16),
      ]);
      set({ swell, wind, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
}));
