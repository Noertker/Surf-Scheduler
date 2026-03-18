import { create } from 'zustand';
import { SwellComponentReading, BuoyObservation } from '@/types/conditions';
import { fetchSwellComponents, fetchBuoyObservations } from '@/services/forecasts';

interface SwellComponentState {
  components: SwellComponentReading[];
  buoyObs: BuoyObservation[];
  loading: boolean;
  error: string | null;
  fetchForStation: (stationId: string) => Promise<void>;
}

export const useSwellComponentStore = create<SwellComponentState>((set) => ({
  components: [],
  buoyObs: [],
  loading: false,
  error: null,

  fetchForStation: async (stationId) => {
    set({ loading: true, error: null });
    try {
      const [components, buoyObs] = await Promise.all([
        fetchSwellComponents(stationId, 48),
        fetchBuoyObservations(stationId, 24),
      ]);
      set({ components, buoyObs, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
}));
