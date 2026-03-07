import { create } from 'zustand';
import { SwellReading, WindReading } from '@/types/conditions';
import { fetchSwellData, fetchWindData } from '@/services/openMeteo';

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
        fetchSwellData(lat, lng, 7),
        fetchWindData(lat, lng, 7),
      ]);
      set({ swell, wind, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
}));
