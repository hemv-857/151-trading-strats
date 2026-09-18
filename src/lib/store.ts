import { create } from "zustand";

export type ViewId = "dashboard" | "library" | "backtest" | "options" | "compare" | "about";

interface AppState {
  view: ViewId;
  selectedStrategyId: string | null;
  detailOpen: boolean;
  compareList: string[];       // strategy ids in compare
  libraryCategory: string | "all";
  librarySearch: string;
  setView: (v: ViewId) => void;
  openStrategy: (id: string) => void;
  closeDetail: () => void;
  toggleCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  setLibraryCategory: (c: string | "all") => void;
  setLibrarySearch: (s: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "dashboard",
  selectedStrategyId: null,
  detailOpen: false,
  compareList: [],
  libraryCategory: "all",
  librarySearch: "",
  setView: (v) => set({ view: v }),
  openStrategy: (id) => set({ selectedStrategyId: id, detailOpen: true }),
  closeDetail: () => set({ detailOpen: false }),
  toggleCompare: (id) =>
    set((s) => ({
      compareList: s.compareList.includes(id)
        ? s.compareList.filter((x) => x !== id)
        : s.compareList.length >= 4
          ? s.compareList
          : [...s.compareList, id],
    })),
  removeFromCompare: (id) => set((s) => ({ compareList: s.compareList.filter((x) => x !== id) })),
  clearCompare: () => set({ compareList: [] }),
  setLibraryCategory: (c) => set({ libraryCategory: c }),
  setLibrarySearch: (s) => set({ librarySearch: s }),
}));
