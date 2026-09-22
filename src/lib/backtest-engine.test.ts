import { describe, it, expect } from "vitest";
import {
  sma,
  ema,
  rsi,
  bollingerBands,
  macd,
  donchianChannel,
  zscore,
  rollingStd,
  gaussian,
  mulberry32,
  generatePriceSeries,
  computeMetrics,
  runPositionStrategy,
} from "@/lib/backtest-engine";

describe("Backtest Engine - Indicators", () => {
  const prices = [100, 101, 102, 103, 104, 105, 104, 103, 102, 101];

  describe("sma", () => {
    it("returns null for first window-1 elements", () => {
      const result = sma(prices, 3);
      expect(result[0]).toBeNull();
      expect(result[1]).toBeNull();
      expect(result[2]).toBeCloseTo(101);
    });

    it("computes correct SMA values", () => {
      const result = sma(prices, 3);
      expect(result[2]).toBeCloseTo(101); // (100+101+102)/3
      expect(result[3]).toBeCloseTo(102); // (101+102+103)/3
    });

    it("handles empty array", () => {
      expect(sma([], 3)).toEqual([]);
    });

    it("handles window larger than array", () => {
      const result = sma(prices, 20);
      expect(result.every((v) => v === null)).toBe(true);
    });
  });

  describe("ema", () => {
    it("returns null for first window-1 elements", () => {
      const result = ema(prices, 3);
      expect(result[0]).toBeNull();
      expect(result[1]).toBeNull();
    });

    it("seeds with SMA then applies EMA formula", () => {
      const result = ema(prices, 3);
      // First valid EMA at index 2 should equal SMA
      expect(result[2]).toBeCloseTo(101);
      // Subsequent values use EMA formula
      expect(result[3]).toBeGreaterThan(101);
    });
  });

  describe("rsi", () => {
    it("returns null for first window elements", () => {
      const result = rsi(prices, 3);
      expect(result[0]).toBeNull();
      expect(result[1]).toBeNull();
      expect(result[2]).toBeNull();
    });

    it("returns 100 for all gains (avgLoss = 0)", () => {
      const upPrices = [100, 101, 102, 103, 104, 105];
      const result = rsi(upPrices, 3);
      expect(result[3]).toBe(100);
    });

    it("returns 0 for all losses", () => {
      const downPrices = [100, 99, 98, 97, 96, 95];
      const result = rsi(downPrices, 3);
      expect(result[3]).toBe(0);
    });
  });

  describe("bollingerBands", () => {
    it("returns middle, upper, lower bands", () => {
      const result = bollingerBands(prices, 3, 2);
      expect(result.middle[2]).toBeCloseTo(101);
      expect(result.upper[2]).toBeGreaterThan(result.middle[2]);
      expect(result.lower[2]).toBeLessThan(result.middle[2]);
    });

    it("bands widen with larger k", () => {
      const narrow = bollingerBands(prices, 3, 1);
      const wide = bollingerBands(prices, 3, 3);
      expect(wide.upper[2] - wide.lower[2]).toBeGreaterThan(narrow.upper[2] - narrow.lower[2]);
    });
  });

  describe("macd", () => {
    it("returns macd, signal, histogram", () => {
      const result = macd(prices, 3, 6, 2);
      expect(result.macd).toBeDefined();
      expect(result.signal).toBeDefined();
      expect(result.histogram).toBeDefined();
    });
  });

  describe("donchianChannel", () => {
    it("computes upper and lower bounds", () => {
      const result = donchianChannel(prices, 3);
      expect(result.upper[2]).toBe(102);
      expect(result.lower[2]).toBe(100);
    });
  });

  describe("zscore", () => {
    it("returns null for first window-1", () => {
      const result = zscore(prices, 3);
      expect(result[0]).toBeNull();
      expect(result[1]).toBeNull();
    });

    it("computes z-scores correctly", () => {
      const result = zscore(prices, 3);
      // At index 2: prices=[100,101,102], mean=101, std=sqrt(2/3)=0.816
      // z = (102-101)/0.816 = 1.225
      expect(result[2]).toBeCloseTo(1.225, 2);
    });
  });

  describe("rollingStd", () => {
    it("computes standard deviation", () => {
      const result = rollingStd(prices, 3);
      expect(result[2]).toBeCloseTo(Math.sqrt(2 / 3), 3);
    });
  });
});

describe("Backtest Engine - PRNG", () => {
  describe("mulberry32", () => {
    it("produces deterministic sequence", () => {
      const rand1 = mulberry32(42);
      const rand2 = mulberry32(42);
      for (let i = 0; i < 10; i++) {
        expect(rand1()).toBe(rand2());
      }
    });

    it("produces values in [0, 1)", () => {
      const rand = mulberry32(42);
      for (let i = 0; i < 100; i++) {
        const v = rand();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });

    it("different seeds produce different sequences", () => {
      const rand1 = mulberry32(42);
      const rand2 = mulberry32(43);
      expect(rand1()).not.toBe(rand2());
    });
  });

  describe("gaussian", () => {
    it("produces normally distributed values", () => {
      const rand = mulberry32(42);
      const samples = Array.from({ length: 10000 }, () => gaussian(rand));
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const std = Math.sqrt(samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length);

      expect(mean).toBeCloseTo(0, 1);
      expect(std).toBeCloseTo(1, 1);
    });
  });
});

describe("Backtest Engine - Price Generation", () => {
  describe("generatePriceSeries", () => {
    it("generates correct number of bars", () => {
      const series = generatePriceSeries({
        symbol: "TEST",
        bars: 100,
        startPrice: 100,
        drift: 0.08,
        volatility: 0.2,
        seed: 42,
      });
      expect(series.points).toHaveLength(100);
    });

    it("starts at startPrice", () => {
      const series = generatePriceSeries({
        symbol: "TEST",
        bars: 10,
        startPrice: 150,
        drift: 0.08,
        volatility: 0.2,
        seed: 42,
      });
      expect(series.points[0].price).toBe(150);
    });

    it("produces deterministic output for same seed", () => {
      const s1 = generatePriceSeries({
        symbol: "TEST",
        bars: 50,
        startPrice: 100,
        drift: 0.08,
        volatility: 0.2,
        seed: 42,
      });
      const s2 = generatePriceSeries({
        symbol: "TEST",
        bars: 50,
        startPrice: 100,
        drift: 0.08,
        volatility: 0.2,
        seed: 42,
      });
      expect(s1.points.map((p) => p.price)).toEqual(s2.points.map((p) => p.price));
    });

    it("different seeds produce different prices", () => {
      const s1 = generatePriceSeries({
        symbol: "TEST",
        bars: 50,
        startPrice: 100,
        drift: 0.08,
        volatility: 0.2,
        seed: 42,
      });
      const s2 = generatePriceSeries({
        symbol: "TEST",
        bars: 50,
        startPrice: 100,
        drift: 0.08,
        volatility: 0.2,
        seed: 43,
      });
      expect(s1.points.map((p) => p.price)).not.toEqual(s2.points.map((p) => p.price));
    });

    it("higher volatility produces wider price range", () => {
      const lowVol = generatePriceSeries({
        symbol: "TEST",
        bars: 200,
        startPrice: 100,
        drift: 0.08,
        volatility: 0.05,
        seed: 42,
      });
      const highVol = generatePriceSeries({
        symbol: "TEST",
        bars: 200,
        startPrice: 100,
        drift: 0.08,
        volatility: 0.5,
        seed: 42,
      });
      const lowRange = Math.max(...lowVol.points.map((p) => p.price)) - Math.min(...lowVol.points.map((p) => p.price));
      const highRange = Math.max(...highVol.points.map((p) => p.price)) - Math.min(...highVol.points.map((p) => p.price));
      expect(highRange).toBeGreaterThan(lowRange);
    });
  });
});

describe("Backtest Engine - Metrics", () => {
  describe("computeMetrics", () => {
    it("computes metrics for profitable strategy", () => {
      const equity = [100000, 101000, 102000, 103000, 104000];
      const benchmark = [100000, 100500, 101000, 101500, 102000];
      const trades = [
        { entryIdx: 0, exitIdx: 2, side: "long", entryPrice: 100, exitPrice: 102, pnl: 2000, returnPct: 0.02 },
        { entryIdx: 2, exitIdx: 4, side: "long", entryPrice: 102, exitPrice: 104, pnl: 2000, returnPct: 0.02 },
      ];
      const metrics = computeMetrics(equity, benchmark, trades, 5);

      expect(metrics.totalReturn).toBeCloseTo(0.04, 3);
      expect(metrics.cagr).toBeGreaterThan(0);
      expect(metrics.sharpe).toBeGreaterThan(0);
      expect(metrics.maxDrawdown).toBe(0);
      expect(metrics.winRate).toBe(1);
      expect(metrics.numTrades).toBe(2);
    });

    it("handles losing strategy", () => {
      const equity = [100000, 99000, 98000, 97000];
      const benchmark = [100000, 100500, 101000, 101500];
      const trades = [
        { entryIdx: 0, exitIdx: 2, side: "long", entryPrice: 100, exitPrice: 98, pnl: -2000, returnPct: -0.02 },
      ];
      const metrics = computeMetrics(equity, benchmark, trades, 4);

      expect(metrics.totalReturn).toBeLessThan(0);
      expect(metrics.maxDrawdown).toBeGreaterThan(0);
      expect(metrics.winRate).toBe(0);
    });

    it("handles single element arrays", () => {
      const equity = [100000];
      const benchmark = [100000];
      const trades: any[] = [];
      const metrics = computeMetrics(equity, benchmark, trades, 1);

      expect(metrics.totalReturn).toBe(0);
      expect(metrics.sharpe).toBe(0);
      expect(metrics.maxDrawdown).toBe(0);
    });
  });
});

describe("Backtest Engine - runPositionStrategy", () => {
  it("computes equity from positions and returns", () => {
    const prices = [100, 101, 102, 103, 102];
    const dates = ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"];
    const positions = [1, 1, 1, 1, 0]; // Long for 4 days, then flat
    const benchmark = prices.map((p) => (p / 100) * 100000);
    const initialCapital = 100000;

    const { equity, trades } = runPositionStrategy(prices, dates, positions, benchmark, initialCapital, 5);

    expect(equity).toHaveLength(5);
    expect(equity[0]).toBe(initialCapital);
    // Day 1: 1% return * 1 position = 1% equity growth
    expect(equity[1]).toBeCloseTo(101000, 0);
    expect(trades.length).toBeGreaterThan(0);
  });

  it("handles flat positions", () => {
    const prices = [100, 101, 102];
    const dates = ["2024-01-01", "2024-01-02", "2024-01-03"];
    const positions = [0, 0, 0];
    const benchmark = prices.map((p) => (p / 100) * 100000);

    const { equity, trades } = runPositionStrategy(prices, dates, positions, benchmark, 100000, 3);

    expect(equity[0]).toBe(100000);
    expect(equity[1]).toBe(100000);
    expect(equity[2]).toBe(100000);
    expect(trades).toHaveLength(0);
  });
});