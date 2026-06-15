import { create } from "zustand";

type SidebarState = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggle: () => void;
};

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,
  setCollapsed: (collapsed) => set({ collapsed }),
  toggle: () => set((s) => ({ collapsed: !s.collapsed })),
}));
