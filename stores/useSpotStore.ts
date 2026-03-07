import { create } from 'zustand';
import { Spot } from '@/types/spot';
import { supabase } from '@/services/supabase';
import { SEED_SPOTS } from '@/constants/spots';

interface SpotState {
  spots: Spot[];
  selectedSpotId: string | null;
  loading: boolean;
  error: string | null;
  fetchSpots: () => Promise<void>;
  selectSpot: (id: string) => void;
}

export const useSpotStore = create<SpotState>((set, get) => ({
  spots: [],
  selectedSpotId: null,
  loading: false,
  error: null,

  fetchSpots: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('spots')
        .select('*')
        .order('name');

      if (error) throw error;

      const spots = (data ?? []) as Spot[];
      set({
        spots,
        loading: false,
        // Auto-select first spot if none selected
        selectedSpotId: get().selectedSpotId ?? spots[0]?.id ?? null,
      });
    } catch (err) {
      // Fallback to seed data if Supabase is unavailable
      const fallback = SEED_SPOTS.map((s, i) => ({
        ...s,
        id: `seed-${i}`,
      }));
      set({
        spots: fallback,
        loading: false,
        error: (err as Error).message,
        selectedSpotId: get().selectedSpotId ?? fallback[0]?.id ?? null,
      });
    }
  },

  selectSpot: (id) => set({ selectedSpotId: id }),
}));

// Derived selector
export const useSelectedSpot = () =>
  useSpotStore((s) => s.spots.find((spot) => spot.id === s.selectedSpotId));
