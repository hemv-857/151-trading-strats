import { describe, it, expect } from "vitest";
import { STRATEGIES, ASSET_CLASSES, getStrategyById, getStrategiesByCategory, getFeaturedStrategies } from "@/lib/strategies-data";

describe("Strategies Data", () => {
  describe("STRATEGIES array", () => {
    it("has 155 strategies", () => {
      expect(STRATEGIES).toHaveLength(155);
    });

    it("each strategy has required fields", () => {
      for (const s of STRATEGIES) {
        expect(s.id).toBeDefined();
        expect(s.number).toBeDefined();
        expect(s.name).toBeDefined();
        expect(s.category).toBeDefined();
        expect(s.type).toBeDefined();
        expect(s.marketView).toBeDefined();
        expect(s.riskLevel).toBeGreaterThanOrEqual(1);
        expect(s.riskLevel).toBeLessThanOrEqual(5);
        expect(s.complexity).toBeGreaterThanOrEqual(1);
        expect(s.complexity).toBeLessThanOrEqual(5);
        expect(s.shortDesc).toBeDefined();
        expect(s.description).toBeDefined();
        expect(Array.isArray(s.keyConcepts)).toBe(true);
        expect(Array.isArray(s.instruments)).toBe(true);
      }
    });

    it("all categories are valid asset class IDs", () => {
      const validCategories = ASSET_CLASSES.map((a) => a.id);
      for (const s of STRATEGIES) {
        expect(validCategories).toContain(s.category);
      }
    });

    it("strategy types are valid", () => {
      const validTypes = ["directional", "arbitrage", "relative-value", "hedging", "machine-learning", "event-driven", "income"];
      for (const s of STRATEGIES) {
        expect(validTypes).toContain(s.type);
      }
    });

    it("market views are valid", () => {
      const validViews = ["bullish", "bearish", "neutral", "volatile", "low-vol", "multi"];
      for (const s of STRATEGIES) {
        expect(validViews).toContain(s.marketView);
      }
    });

    it("no duplicate IDs", () => {
      const ids = STRATEGIES.map((s) => s.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });

  describe("ASSET_CLASSES", () => {
    it("has 19 asset classes (chapters 2-20)", () => {
      expect(ASSET_CLASSES).toHaveLength(19);
    });

    it("each has required fields", () => {
      for (const a of ASSET_CLASSES) {
        expect(a.id).toBeDefined();
        expect(a.chapter).toBeGreaterThanOrEqual(2);
        expect(a.chapter).toBeLessThanOrEqual(20);
        expect(a.name).toBeDefined();
        expect(a.tagline).toBeDefined();
        expect(a.icon).toBeDefined();
        expect(a.accent).toBeDefined();
      }
    });

    it("chapters are sequential 2-20", () => {
      const chapters = ASSET_CLASSES.map((a) => a.chapter).sort((a, b) => a - b);
      for (let i = 0; i < chapters.length; i++) {
        expect(chapters[i]).toBe(i + 2);
      }
    });
  });

  describe("getStrategyById", () => {
    it("returns strategy for valid ID", () => {
      const s = getStrategyById("long-call");
      expect(s).toBeDefined();
      expect(s?.id).toBe("long-call");
    });

    it("returns undefined for invalid ID", () => {
      expect(getStrategyById("invalid-id")).toBeUndefined();
    });
  });

  describe("getStrategiesByCategory", () => {
    it("returns strategies for valid category", () => {
      const options = getStrategiesByCategory("options");
      expect(options.length).toBeGreaterThan(0);
      for (const s of options) {
        expect(s.category).toBe("options");
      }
    });

    it("returns empty array for invalid category", () => {
      expect(getStrategiesByCategory("invalid")).toHaveLength(0);
    });
  });

  describe("getFeaturedStrategies", () => {
    it("returns only featured strategies", () => {
      const featured = getFeaturedStrategies();
      for (const s of featured) {
        expect(s.featured).toBe(true);
      }
    });

    it("returns at least some strategies", () => {
      expect(getFeaturedStrategies().length).toBeGreaterThan(0);
    });
  });
});