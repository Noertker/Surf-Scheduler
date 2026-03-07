import { create } from 'zustand';
import { Surfboard } from '@/types/surfboard';
import {
  fetchSurfboards,
  createSurfboard,
  updateSurfboard,
  deleteSurfboard,
} from '@/services/surfboards';

interface SurfboardState {
  boards: Surfboard[];
  loading: boolean;
  error: string | null;
  fetchBoards: () => Promise<void>;
  addBoard: (board: Omit<Surfboard, 'id' | 'created_at'>) => Promise<void>;
  editBoard: (id: string, updates: Partial<Omit<Surfboard, 'id' | 'user_id' | 'created_at'>>) => Promise<void>;
  removeBoard: (id: string) => Promise<void>;
}

export const useSurfboardStore = create<SurfboardState>((set) => ({
  boards: [],
  loading: false,
  error: null,

  fetchBoards: async () => {
    set({ loading: true, error: null });
    try {
      const boards = await fetchSurfboards();
      set({ boards, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  addBoard: async (board) => {
    try {
      const saved = await createSurfboard(board);
      set((s) => ({ boards: [saved, ...s.boards] }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  editBoard: async (id, updates) => {
    try {
      const saved = await updateSurfboard(id, updates);
      set((s) => ({
        boards: s.boards.map((b) => (b.id === id ? saved : b)),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  removeBoard: async (id) => {
    try {
      await deleteSurfboard(id);
      set((s) => ({ boards: s.boards.filter((b) => b.id !== id) }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
