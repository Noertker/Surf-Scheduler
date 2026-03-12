import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SpotGroup } from '@/types/group';
import { Spot } from '@/types/spot';
import { fetchSpotGroups, fetchGroupSpots } from '@/services/spotGroups';

const ACTIVE_GROUP_KEY = 'kairo_active_group';

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
      // Restore last-used group, or fall back to first group
      if (!get().activeGroupId && groups.length > 0) {
        const savedId = await AsyncStorage.getItem(ACTIVE_GROUP_KEY);
        const restoredGroup = savedId && groups.find((g) => g.id === savedId);
        await get().setActiveGroup(restoredGroup ? restoredGroup.id : groups[0].id);
      }
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  setActiveGroup: async (groupId) => {
    set({ activeGroupId: groupId, loading: true });
    AsyncStorage.setItem(ACTIVE_GROUP_KEY, groupId).catch(() => {});
    try {
      const spots = await fetchGroupSpots(groupId);
      set({ groupSpots: spots, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
}));
