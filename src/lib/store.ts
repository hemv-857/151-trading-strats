import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ViewId = "dashboard" | "library" | "backtest" | "options" | "compare" | "about" | "glossary";

interface AppState {
  view: ViewId;
  selectedStrategyId: string | null;
  detailOpen: boolean;
  compareList: string[];       // strategy ids in compare
  favorites: string[];         // strategy ids in favorites (persisted)
  libraryCategory: string | "all";
  librarySearch: string;
  libraryFavoritesOnly: boolean;
  setView: (v: ViewId) => void;
  openStrategy: (id: string) => void;
  closeDetail: () => void;
  toggleCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  toggleFavorite: (id: string) => void;
  removeFromFavorites: (id: string) => void;
  clearFavorites: () => void;
  setLibraryCategory: (c: string | "all") => void;
  setLibrarySearch: (s: string) => void;
  setLibraryFavoritesOnly: (b: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      view: "dashboard",
      selectedStrategyId: null,
      detailOpen: false,
      compareList: [],
      favorites: [],
      libraryCategory: "all",
      librarySearch: "",
      libraryFavoritesOnly: false,
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
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((x) => x !== id)
            : [...s.favorites, id],
        })),
      removeFromFavorites: (id) => set((s) => ({ favorites: s.favorites.filter((x) => x !== id) })),
      clearFavorites: () => set({ favorites: [] }),
      setLibraryCategory: (c) => set({ libraryCategory: c }),
      setLibrarySearch: (s) => set({ librarySearch: s }),
      setLibraryFavoritesOnly: (b) => set({ libraryFavoritesOnly: b }),
    }),
    {
      name: "quant-terminal-storage",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : (undefined as any))),
      // Only persist favorites (not view state, not transient UI state)
      partialize: (s) => ({ favorites: s.favorites }),
    }
  )
);
