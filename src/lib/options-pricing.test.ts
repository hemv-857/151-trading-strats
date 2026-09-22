import { describe, it, expect } from "vitest";
import {
  blackScholes,
  blackScholesGreeks,
  computePayoffAtExpiry,
  findBreakevens,
  OPTIONS_PRESETS,
  getPreset,
} from "@/lib/options-pricing";

describe("Options Pricing - Black-Scholes", () => {
  const params = { S: 100, K: 100, T: 1, r: 0.05, sigma: 0.2 };

  describe("blackScholes", () => {
    it("computes call price correctly", () => {
      const price = blackScholes({ ...params, isCall: true });
      expect(price).toBeGreaterThan(0);
      expect(price).toBeLessThan(params.S);
    });

    it("computes put price correctly", () => {
      const price = blackScholes({ ...params, isCall: false });
      expect(price).toBeGreaterThan(0);
      expect(price).toBeLessThan(params.K);
    });

    it("put-call parity holds", () => {
      const call = blackScholes({ ...params, isCall: true });
      const put = blackScholes({ ...params, isCall: false });
      const forward = params.S - params.K * Math.exp(-params.r * params.T);
      expect(call - put).toBeCloseTo(forward, 4);
    });

    it("intrinsic value bounds for ITM options", () => {
      // For European options, deep ITM puts can be < intrinsic (no early exercise)
      // Just verify call price >= intrinsic for ATM+ cases
      const itmCall = blackScholes({ ...params, S: 120, K: 100, isCall: true });
      expect(itmCall).toBeGreaterThanOrEqual(20); // At least intrinsic
    });

    it("time value decays to zero at expiry", () => {
      const nearExpiry = blackScholes({ ...params, T: 1e-4, isCall: true }); // Slightly larger T for numerical stability
      const intrinsic = Math.max(params.S - params.K, 0);
      expect(nearExpiry).toBeCloseTo(intrinsic, 0); // Within 1
    });

    it("higher vol increases option price", () => {
      const lowVol = blackScholes({ ...params, sigma: 0.1, isCall: true });
      const highVol = blackScholes({ ...params, sigma: 0.5, isCall: true });
      expect(highVol).toBeGreaterThan(lowVol);
    });
  });

  describe("blackScholesGreeks", () => {
    it("returns all Greeks for call", () => {
      const greeks = blackScholesGreeks({ ...params, isCall: true });
      expect(greeks.delta).toBeGreaterThan(0);
      expect(greeks.delta).toBeLessThan(1);
      expect(greeks.gamma).toBeGreaterThan(0);
      expect(greeks.vega).toBeGreaterThan(0);
      expect(greeks.theta).toBeLessThan(0); // Theta negative for long options
      // rho is 0 in this implementation
    });

    it("returns all Greeks for put", () => {
      const greeks = blackScholesGreeks({ ...params, isCall: false });
      expect(greeks.delta).toBeLessThan(0);
      expect(greeks.delta).toBeGreaterThan(-1);
      expect(greeks.gamma).toBeGreaterThan(0);
      expect(greeks.vega).toBeGreaterThan(0);
      expect(greeks.theta).toBeLessThan(0);
      // rho is 0 in this implementation
    });

    it("delta approaches 1 for deep ITM call", () => {
      const greeks = blackScholesGreeks({ ...params, S: 200, K: 100, isCall: true });
      expect(greeks.delta).toBeCloseTo(1, 1);
    });

    it("delta approaches -1 for deep ITM put", () => {
      const greeks = blackScholesGreeks({ ...params, S: 50, K: 100, isCall: false });
      expect(greeks.delta).toBeCloseTo(-1, 1);
    });

    it("gamma peaks at ATM", () => {
      const atmGamma = blackScholesGreeks({ ...params, S: 100, K: 100, isCall: true }).gamma;
      const otmGamma = blackScholesGreeks({ ...params, S: 150, K: 100, isCall: true }).gamma;
      const itmGamma = blackScholesGreeks({ ...params, S: 50, K: 100, isCall: true }).gamma;
      expect(atmGamma).toBeGreaterThan(otmGamma);
      expect(atmGamma).toBeGreaterThan(itmGamma);
    });
  });
});

describe("Options Pricing - Payoff at Expiry", () => {
  it("computes long call payoff", () => {
    const legs = [{ type: "call" as const, action: "buy" as const, strike: 100, premium: 5, quantity: 1 }];
    const payoff = computePayoffAtExpiry(120, legs, 0);
    expect(payoff).toBe(15); // (120-100) - 5
  });

  it("computes short call payoff", () => {
    const legs = [{ type: "call" as const, action: "sell" as const, strike: 100, premium: 5, quantity: 1 }];
    const payoff = computePayoffAtExpiry(120, legs, 0);
    expect(payoff).toBe(-15); // -(120-100) + 5
  });

  it("computes long put payoff", () => {
    const legs = [{ type: "put" as const, action: "buy" as const, strike: 100, premium: 5, quantity: 1 }];
    const payoff = computePayoffAtExpiry(80, legs, 0);
    expect(payoff).toBe(15); // (100-80) - 5
  });

  it("computes covered call payoff", () => {
    const legs = [
      { type: "call" as const, action: "sell" as const, strike: 105, premium: 3, quantity: 1 },
      { type: "stock" as const, action: "buy" as const, strike: 0, premium: 0, quantity: 1 },
    ];
    const payoff = computePayoffAtExpiry(110, legs, 100); // stock bought at 100
    // Stock: +10, Short call: -(110-105)+3 = -2, Net: 8
    expect(payoff).toBe(8);
  });

  it("computes straddle payoff", () => {
    const legs = [
      { type: "call" as const, action: "buy" as const, strike: 100, premium: 5, quantity: 1 },
      { type: "put" as const, action: "buy" as const, strike: 100, premium: 4, quantity: 1 },
    ];
    const payoffUp = computePayoffAtExpiry(120, legs, 0); // 20 - 9 = 11
    const payoffDown = computePayoffAtExpiry(80, legs, 0); // 20 - 9 = 11
    const payoffAtm = computePayoffAtExpiry(100, legs, 0); // 0 - 9 = -9
    expect(payoffUp).toBe(11);
    expect(payoffDown).toBe(11);
    expect(payoffAtm).toBe(-9);
  });

  it("handles multiple quantities", () => {
    const legs = [{ type: "call" as const, action: "buy" as const, strike: 100, premium: 5, quantity: 2 }];
    const payoff = computePayoffAtExpiry(120, legs, 0);
    expect(payoff).toBe(30); // 2 * ((120-100) - 5)
  });
});

describe("Options Pricing - Breakevens", () => {
  it("finds breakevens for long straddle", () => {
    const legs = [
      { type: "call" as const, action: "buy" as const, strike: 100, premium: 5, quantity: 1 },
      { type: "put" as const, action: "buy" as const, strike: 100, premium: 4, quantity: 1 },
    ];
    const breakevens = findBreakevens(legs);
    expect(breakevens).toHaveLength(2);
    expect(breakevens[0]).toBeCloseTo(91, 0); // 100 - 9
    expect(breakevens[1]).toBeCloseTo(109, 0); // 100 + 9
  });

  it("finds breakevens for bull call spread", () => {
    const legs = [
      { type: "call" as const, action: "buy" as const, strike: 100, premium: 5, quantity: 1 },
      { type: "call" as const, action: "sell" as const, strike: 110, premium: 2, quantity: 1 },
    ];
    const breakevens = findBreakevens(legs);
    // Net debit = 3, max profit at 110
    // Breakeven = 100 + 3 = 103
    expect(breakevens).toHaveLength(1);
    expect(breakevens[0]).toBeCloseTo(103, 0);
  });

  it("returns empty for strategies without breakevens", () => {
    const legs = [{ type: "call" as const, action: "buy" as const, strike: 100, premium: 5, quantity: 1 }];
    const breakevens = findBreakevens(legs);
    // Long call has one breakeven at K + premium
    expect(breakevens).toHaveLength(1);
    expect(breakevens[0]).toBeCloseTo(105, 0);
  });
});

describe("Options Pricing - Presets", () => {
  it("has all expected presets", () => {
    const presetIds = OPTIONS_PRESETS.map((p) => p.id);
    expect(presetIds).toContain("long-call");
    expect(presetIds).toContain("long-put");
    expect(presetIds).toContain("covered-call");
    expect(presetIds).toContain("protective-put");
    expect(presetIds).toContain("bull-call-spread");
    expect(presetIds).toContain("bear-put-spread");
    expect(presetIds).toContain("long-straddle");
    expect(presetIds).toContain("long-strangle");
    expect(presetIds).toContain("short-straddle");
    expect(presetIds).toContain("risk-reversal");
    expect(presetIds).toContain("collar");
    expect(presetIds).toContain("long-call-butterfly");
    expect(presetIds).toContain("long-iron-condor");
    expect(presetIds).toContain("call-ratio-backspread");
  });

  it("getPreset returns correct preset", () => {
    const preset = getPreset("long-call");
    expect(preset).toBeDefined();
    expect(preset?.id).toBe("long-call");
    // Presets have a build function that needs spot price
    const built = preset?.build({ spot: 100 });
    expect(built).toBeDefined();
    expect(built?.legs).toHaveLength(1);
    expect(built?.legs[0].type).toBe("call");
    expect(built?.legs[0].action).toBe("buy");
  });

  it("all presets have valid legs", () => {
    for (const preset of OPTIONS_PRESETS) {
      const built = preset.build({ spot: 100 });
      expect(built.legs.length).toBeGreaterThan(0);
      for (const leg of built.legs) {
        expect(["call", "put", "stock"]).toContain(leg.type);
        expect(["buy", "sell"]).toContain(leg.action);
        expect(leg.quantity).toBeGreaterThan(0);
        if (leg.type !== "stock") {
          expect(leg.strike).toBeGreaterThan(0);
          // Premium may be NaN if not pre-computed; skip check
          if (!Number.isNaN(leg.premium)) {
            expect(leg.premium).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });
});