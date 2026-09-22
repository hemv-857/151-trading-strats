import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAppStore } from "@/lib/store";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

vi.stubGlobal("localStorage", localStorageMock);

describe("App Store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store
    useAppStore.setState({
      view: "dashboard",
      selectedStrategyId: null,
      detailOpen: false,
      compareList: [],
      favorites: [],
      recentlyViewed: [],
      libraryCategory: "all",
      librarySearch: "",
      libraryFavoritesOnly: false,
    });
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe("view management", () => {
    it("sets view", () => {
      useAppStore.getState().setView("library");
      expect(useAppStore.getState().view).toBe("library");
    });

    it("accepts all valid view IDs", () => {
      const views = ["dashboard", "library", "backtest", "backtest-compare", "options", "compare", "glossary", "about", "favorites"];
      for (const v of views) {
        useAppStore.getState().setView(v as any);
        expect(useAppStore.getState().view).toBe(v);
      }
    });
  });

  describe("strategy detail drawer", () => {
    it("opens drawer with strategy ID", () => {
      useAppStore.getState().openStrategy("long-call");
      expect(useAppStore.getState().selectedStrategyId).toBe("long-call");
      expect(useAppStore.getState().detailOpen).toBe(true);
    });

    it("closes drawer", () => {
      useAppStore.getState().openStrategy("long-call");
      useAppStore.getState().closeDetail();
      expect(useAppStore.getState().detailOpen).toBe(false);
      expect(useAppStore.getState().selectedStrategyId).toBe("long-call"); // ID preserved
    });

    it("tracks recently viewed", () => {
      useAppStore.getState().openStrategy("long-call");
      useAppStore.getState().openStrategy("long-put");
      useAppStore.getState().openStrategy("covered-call");

      const recent = useAppStore.getState().recentlyViewed;
      expect(recent[0]).toBe("covered-call");
      expect(recent[1]).toBe("long-put");
      expect(recent[2]).toBe("long-call");
    });

    it("deduplicates recently viewed", () => {
      useAppStore.getState().openStrategy("long-call");
      useAppStore.getState().openStrategy("long-put");
      useAppStore.getState().openStrategy("long-call"); // View again

      const recent = useAppStore.getState().recentlyViewed;
      expect(recent.filter((id) => id === "long-call")).toHaveLength(1);
    });

    it("caps recently viewed at 8", () => {
      for (let i = 0; i < 10; i++) {
        useAppStore.getState().openStrategy(`strat-${i}`);
      }
      expect(useAppStore.getState().recentlyViewed).toHaveLength(8);
    });
  });

  describe("compare list", () => {
    it("toggles strategy in compare list", () => {
      useAppStore.getState().toggleCompare("long-call");
      expect(useAppStore.getState().compareList).toContain("long-call");

      useAppStore.getState().toggleCompare("long-call");
      expect(useAppStore.getState().compareList).not.toContain("long-call");
    });

    it("limits compare list to 4", () => {
      useAppStore.getState().toggleCompare("s1");
      useAppStore.getState().toggleCompare("s2");
      useAppStore.getState().toggleCompare("s3");
      useAppStore.getState().toggleCompare("s4");
      useAppStore.getState().toggleCompare("s5"); // Should not be added

      expect(useAppStore.getState().compareList).toHaveLength(4);
      expect(useAppStore.getState().compareList).not.toContain("s5");
    });

    it("removes specific strategy", () => {
      useAppStore.getState().toggleCompare("long-call");
      useAppStore.getState().toggleCompare("long-put");
      useAppStore.getState().removeFromCompare("long-call");
      expect(useAppStore.getState().compareList).not.toContain("long-call");
      expect(useAppStore.getState().compareList).toContain("long-put");
    });

    it("clears compare list", () => {
      useAppStore.getState().toggleCompare("s1");
      useAppStore.getState().toggleCompare("s2");
      useAppStore.getState().clearCompare();
      expect(useAppStore.getState().compareList).toHaveLength(0);
    });
  });

describe("favorites", () => {
    it("toggles favorite", () => {
      useAppStore.getState().toggleFavorite("long-call");
      expect(useAppStore.getState().favorites).toContain("long-call");

      useAppStore.getState().toggleFavorite("long-call");
      expect(useAppStore.getState().favorites).not.toContain("long-call");
    });

    it("removes specific favorite", () => {
      useAppStore.getState().toggleFavorite("s1");
      useAppStore.getState().toggleFavorite("s2");
      useAppStore.getState().removeFromFavorites("s1");
      expect(useAppStore.getState().favorites).not.toContain("s1");
    });

    it("clears all favorites", () => {
      useAppStore.getState().toggleFavorite("s1");
      useAppStore.getState().toggleFavorite("s2");
      useAppStore.getState().clearFavorites();
      expect(useAppStore.getState().favorites).toHaveLength(0);
    });
  });

  describe("library filters", () => {
    it("sets category filter", () => {
      useAppStore.getState().setLibraryCategory("options");
      expect(useAppStore.getState().libraryCategory).toBe("options");
    });

    it("sets search query", () => {
      useAppStore.getState().setLibrarySearch("momentum");
      expect(useAppStore.getState().librarySearch).toBe("momentum");
    });

    it("toggles favorites-only filter", () => {
      useAppStore.getState().setLibraryFavoritesOnly(true);
      expect(useAppStore.getState().libraryFavoritesOnly).toBe(true);
    });

    it("clears recently viewed", () => {
      useAppStore.getState().openStrategy("s1");
      useAppStore.getState().clearRecentlyViewed();
      expect(useAppStore.getState().recentlyViewed).toHaveLength(0);
    });
  });
});