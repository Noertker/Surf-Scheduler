import { create } from 'zustand';

interface NavigationState {
  /** When set, the calendar tab scrolls to this date and clears it */
  targetDate: Date | null;
  setTargetDate: (date: Date | null) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  targetDate: null,
  setTargetDate: (date) => set({ targetDate: date }),
}));
