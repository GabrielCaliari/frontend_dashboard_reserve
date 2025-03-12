import { create } from "zustand";

interface WidgetStore {
  isOpen: boolean;
  toggleWidget: () => void;
  closeWidget: () => void;
}

export const useWidgetStore = create<WidgetStore>((set) => ({
  isOpen: false,
  toggleWidget: () => set((state) => ({ isOpen: !state.isOpen })),
  closeWidget: () => set({ isOpen: false }),
}));
