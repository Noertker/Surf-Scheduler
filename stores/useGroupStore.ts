import { create } from 'zustand';
import { SpotGroup } from '@/types/group';
import { Spot } from '@/types/spot';
import { fetchSpotGroups, fetchGroupSpots } from '@/services/spotGroups';

interface GroupState {
  groups: SpotGroup[];
  activeGroupId: string | null;
  groupSpots: Spot[];
  loading: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  setActiveGroup: (groupId: string) => Promise<void>;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  activeGroupId: null,
  groupSpots: [],
  loading: false,
  error: null,

  fetchGroups: async () => {
    set({ loading: true, error: null });
    try {
      const groups = await fetchSpotGroups();
      set({ groups, loading: false });
      // Auto-select first group if none selected
      if (!get().activeGroupId && groups.length > 0) {
        await get().setActiveGroup(groups[0].id);
      }
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  setActiveGroup: async (groupId) => {
    set({ activeGroupId: groupId, loading: true });
    try {
      const spots = await fetchGroupSpots(groupId);
      set({ groupSpots: spots, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
}));
