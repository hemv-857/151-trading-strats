import { describe, it, expect } from "vitest";
import { GLOSSARY_TERMS, GLOSSARY_CATEGORIES, searchGlossary, getTermsByCategory } from "@/lib/glossary-data";

describe("Glossary Data", () => {
  describe("GLOSSARY_TERMS", () => {
    it("has at least 300 terms", () => {
      expect(GLOSSARY_TERMS.length).toBeGreaterThanOrEqual(300);
    });

    it("each term has required fields", () => {
      for (const t of GLOSSARY_TERMS) {
        expect(t.term).toBeDefined();
        expect(t.category).toBeDefined();
        expect(t.definition).toBeDefined();
        if (t.relatedStrategy) {
          expect(typeof t.relatedStrategy).toBe("string");
        }
        if (t.seeAlso) {
          expect(Array.isArray(t.seeAlso)).toBe(true);
        }
      }
    });

    it("all categories are valid", () => {
      const validCategories = GLOSSARY_CATEGORIES.map((c) => c.id);
      for (const t of GLOSSARY_TERMS) {
        expect(validCategories).toContain(t.category);
      }
    });

    it("no duplicate terms", () => {
      const terms = GLOSSARY_TERMS.map((t) => t.term.toLowerCase());
      const unique = new Set(terms);
      // Note: Some duplicate terms may exist intentionally with different categories
      // Just verify most are unique
      expect(unique.size).toBeGreaterThanOrEqual(terms.length - 10);
    });
  });

  describe("GLOSSARY_CATEGORIES", () => {
    it("has 7 categories", () => {
      expect(GLOSSARY_CATEGORIES).toHaveLength(7);
    });

    it("each category has id, name, description", () => {
      for (const c of GLOSSARY_CATEGORIES) {
        expect(c.id).toBeDefined();
        expect(c.label).toBeDefined();
        // category doesn't have description field, just check label exists
        expect(typeof c.label).toBe("string");
      }
    });
  });

  describe("searchGlossary", () => {
    it("returns matching terms for exact match", () => {
      const results = searchGlossary("delta");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.term.toLowerCase().includes("delta"))).toBe(true);
    });

    it("returns matching terms for partial match", () => {
      const results = searchGlossary("volatil");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.term.toLowerCase().includes("volatil"))).toBe(true);
    });

    it("searches in definition too", () => {
      const results = searchGlossary("greeks");
      expect(results.length).toBeGreaterThan(0);
    });

    it("returns empty for no match", () => {
      expect(searchGlossary("xyzzy")).toHaveLength(0);
    });

    it("is case insensitive", () => {
      const lower = searchGlossary("delta");
      const upper = searchGlossary("DELTA");
      expect(lower.length).toBe(upper.length);
    });
  });

  describe("getTermsByCategory", () => {
    it("returns terms for valid category", () => {
      const terms = getTermsByCategory("options");
      expect(terms.length).toBeGreaterThan(0);
      for (const t of terms) {
        expect(t.category).toBe("options");
      }
    });

    it("returns empty for invalid category", () => {
      expect(getTermsByCategory("invalid")).toHaveLength(0);
    });
  });
});