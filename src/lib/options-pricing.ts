// Options pricing (Black-Scholes) and payoff diagram engine
// Supports arbitrary combinations of option legs + stock positions.

export type OptionType = "call" | "put";
export type PositionAction = "buy" | "sell";

export interface OptionLeg {
  id: string;
  type: OptionType;
  action: PositionAction;
  strike: number;
  premium: number;   // per share
  quantity: number; // positive integer
}

export interface StockLeg {
  action: PositionAction;
  shares: number;
  price: number;    // entry price
}

export interface OptionsStrategy {
  id: string;
  name: string;
  category: string;
  marketView: string;
  description: string;
  legs: OptionLeg[];
  stock?: StockLeg;
}

// Standard normal CDF (Abramowitz & Stegun approximation)
export function normCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

// Black-Scholes call/put price
export function bsPrice(
  type: OptionType,
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number
): number {
  if (T <= 0 || sigma <= 0) {
    // Intrinsic value at expiry
    return type === "call" ? Math.max(S - K, 0) : Math.max(K - S, 0);
  }
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  if (type === "call") {
    return S * normCdf(d1) - K * Math.exp(-r * T) * normCdf(d2);
  }
  return K * Math.exp(-r * T) * normCdf(-d2) - S * normCdf(-d1);
}

// Greeks
export function bsDelta(type: OptionType, S: number, K: number, T: number, r: number, sigma: number): number {
  if (T <= 0 || sigma <= 0) return type === "call" ? (S > K ? 1 : 0) : (S > K ? 0 : -1);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  return type === "call" ? normCdf(d1) : normCdf(d1) - 1;
}

export function bsGamma(S: number, K: number, T: number, r: number, sigma: number): number {
  if (T <= 0 || sigma <= 0) return 0;
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  return Math.exp(-d1 * d1 / 2) / (S * sigma * Math.sqrt(2 * Math.PI * T));
}

export function bsVega(S: number, K: number, T: number, r: number, sigma: number): number {
  if (T <= 0 || sigma <= 0) return 0;
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  return S * Math.sqrt(T) * Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI) / 100;
}

export function bsTheta(type: OptionType, S: number, K: number, T: number, r: number, sigma: number): number {
  if (T <= 0 || sigma <= 0) return 0;
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const common = -(S * Math.exp(-d1 * d1 / 2) * sigma) / (2 * Math.sqrt(2 * Math.PI * T));
  if (type === "call") {
    return (common - r * K * Math.exp(-r * T) * normCdf(d2)) / 365;
  }
  return (common + r * K * Math.exp(-r * T) * normCdf(-d2)) / 365;
}

// Payoff at expiry for a single leg (per share, excluding premium cost)
export function legPayoffAtExpiry(leg: OptionLeg, S: number): number {
  const intrinsic = leg.type === "call" ? Math.max(S - leg.strike, 0) : Math.max(leg.strike - S, 0);
  const sign = leg.action === "buy" ? 1 : -1;
  // Premium: buy pays premium (cost), sell receives premium (income)
  return sign * (intrinsic - leg.premium) * leg.quantity;
}

export function strategyPayoffAtExpiry(strategy: OptionsStrategy, S: number): number {
  let payoff = strategy.legs.reduce((sum, leg) => sum + legPayoffAtExpiry(leg, S), 0);
  if (strategy.stock) {
    const sign = strategy.stock.action === "buy" ? 1 : -1;
    payoff += sign * (S - strategy.stock.price) * strategy.stock.shares;
  }
  return payoff;
}

// Build a payoff curve across a range of underlying prices
export function buildPayoffCurve(
  strategy: OptionsStrategy,
  spot: number,
  options: { rangePct?: number; steps?: number } = {}
): { prices: number[]; payoffs: number[]; breakevens: number[]; maxProfit: number; maxLoss: number } {
  const rangePct = options.rangePct ?? 0.4;
  const steps = options.steps ?? 81;
  const min = spot * (1 - rangePct);
  const max = spot * (1 + rangePct);
  const prices: number[] = [];
  const payoffs: number[] = [];
  for (let i = 0; i < steps; i++) {
    const S = min + (max - min) * (i / (steps - 1));
    prices.push(S);
    payoffs.push(strategyPayoffAtExpiry(strategy, S));
  }

  // Find breakevens (where payoff crosses zero)
  const breakevens: number[] = [];
  for (let i = 1; i < payoffs.length; i++) {
    if (payoffs[i - 1] * payoffs[i] < 0) {
      // Linear interpolation
      const ratio = Math.abs(payoffs[i - 1]) / (Math.abs(payoffs[i - 1]) + Math.abs(payoffs[i]));
      const be = prices[i - 1] + ratio * (prices[i] - prices[i - 1]);
      breakevens.push(be);
    }
  }

  // Max profit / loss (within range; for unbounded, approximate with asymptote)
  const maxPayoff = Math.max(...payoffs);
  const minPayoff = Math.min(...payoffs);
  // Heuristic: if payoff at extreme is the max and unbounded direction → "Unlimited"
  const edgeMax = Math.max(payoffs[0], payoffs[payoffs.length - 1]);
  const edgeMin = Math.min(payoffs[0], payoffs[payoffs.length - 1]);

  const maxProfit = edgeMax === maxPayoff && maxPayoff > 0 ? Infinity : maxPayoff;
  const maxLoss = edgeMin === minPayoff && minPayoff < 0 ? -Infinity : minPayoff;

  return { prices, payoffs, breakevens, maxProfit, maxLoss };
}

// Compute net cost / credit of a strategy
export function strategyNetCost(strategy: OptionsStrategy): number {
  let cost = strategy.legs.reduce((sum, leg) => {
    const sign = leg.action === "buy" ? 1 : -1;
    return sum + sign * leg.premium * leg.quantity;
  }, 0);
  if (strategy.stock) {
    const sign = strategy.stock.action === "buy" ? 1 : -1;
    cost += sign * strategy.stock.price * strategy.stock.shares;
  }
  return cost;
}

// Aggregate Greeks for the strategy
export interface StrategyGreeks {
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
}

export function strategyGreeks(strategy: OptionsStrategy, S: number, T: number, r: number, sigma: number): StrategyGreeks {
  let delta = 0, gamma = 0, vega = 0, theta = 0;
  for (const leg of strategy.legs) {
    const sign = leg.action === "buy" ? 1 : -1;
    const qty = leg.quantity * 100; // 1 contract = 100 shares
    delta += sign * qty * bsDelta(leg.type, S, leg.strike, T, r, sigma);
    gamma += sign * qty * bsGamma(S, leg.strike, T, r, sigma);
    vega += sign * qty * bsVega(S, leg.strike, T, r, sigma);
    theta += sign * qty * bsTheta(leg.type, S, leg.strike, T, r, sigma);
  }
  if (strategy.stock) {
    const sign = strategy.stock.action === "buy" ? 1 : -1;
    delta += sign * strategy.stock.shares;
  }
  return { delta, gamma, vega, theta };
}

// ----- Preset options strategies -----
function makeLeg(id: string, type: OptionType, action: PositionAction, strike: number, premium: number, quantity = 1): OptionLeg {
  return { id, type, action, strike, premium, quantity };
}

export interface PresetInput {
  spot: number;
  atmVol: number;   // annualized vol (e.g. 0.20)
  T: number;        // years to expiry
  r?: number;       // risk-free rate
  spread?: number;  // spread width as fraction of spot
}

// Compute a "market" premium for a strike using BS (so presets are realistic)
function marketPremium(type: OptionType, S: number, K: number, T: number, r: number, sigma: number): number {
  return Math.max(0.01, bsPrice(type, S, K, T, r, sigma));
}

export const OPTION_PRESETS: { id: string; name: string; marketView: string; description: string; build: (i: PresetInput) => OptionsStrategy }[] = [
  {
    id: "long-call",
    name: "Long Call",
    marketView: "Bullish",
    description: "Buy a call — leveraged upside, capped downside at premium paid.",
    build: (i) => {
      const K = i.spot;
      const r = i.r ?? 0.03;
      const prem = marketPremium("call", i.spot, K, i.T, r, i.atmVol);
      return {
        id: "long-call", name: "Long Call", category: "options", marketView: "Bullish",
        description: "Buy a call — leveraged upside, capped downside at premium paid.",
        legs: [makeLeg("l1", "call", "buy", K, prem)],
      };
    },
  },
  {
    id: "long-put",
    name: "Long Put",
    marketView: "Bearish",
    description: "Buy a put — profits from declines, capped downside at premium paid.",
    build: (i) => {
      const K = i.spot;
      const r = i.r ?? 0.03;
      const prem = marketPremium("put", i.spot, K, i.T, r, i.atmVol);
      return {
        id: "long-put", name: "Long Put", category: "options", marketView: "Bearish",
        description: "Buy a put — profits from declines, capped downside at premium paid.",
        legs: [makeLeg("l1", "put", "buy", K, prem)],
      };
    },
  },
  {
    id: "covered-call",
    name: "Covered Call",
    marketView: "Neutral",
    description: "Long stock + short call. Income from theta, caps upside.",
    build: (i) => {
      const K = i.spot * 1.05;
      const r = i.r ?? 0.03;
      const prem = marketPremium("call", i.spot, K, i.T, r, i.atmVol);
      return {
        id: "covered-call", name: "Covered Call", category: "options", marketView: "Neutral",
        description: "Long stock + short call. Income from theta, caps upside.",
        legs: [makeLeg("l1", "call", "sell", K, prem)],
        stock: { action: "buy", shares: 100, price: i.spot },
      };
    },
  },
  {
    id: "protective-put",
    name: "Protective Put",
    marketView: "Bullish",
    description: "Long stock + long put. Like insurance on the long position.",
    build: (i) => {
      const K = i.spot * 0.95;
      const r = i.r ?? 0.03;
      const prem = marketPremium("put", i.spot, K, i.T, r, i.atmVol);
      return {
        id: "protective-put", name: "Protective Put", category: "options", marketView: "Bullish",
        description: "Long stock + long put. Like insurance on the long position.",
        legs: [makeLeg("l1", "put", "buy", K, prem)],
        stock: { action: "buy", shares: 100, price: i.spot },
      };
    },
  },
  {
    id: "bull-call-spread",
    name: "Bull Call Spread",
    marketView: "Bullish",
    description: "Buy lower-strike call, sell higher-strike call. Capped risk and reward.",
    build: (i) => {
      const spread = i.spread ?? 0.1;
      const K1 = i.spot;
      const K2 = i.spot * (1 + spread);
      const r = i.r ?? 0.03;
      const p1 = marketPremium("call", i.spot, K1, i.T, r, i.atmVol);
      const p2 = marketPremium("call", i.spot, K2, i.T, r, i.atmVol);
      return {
        id: "bull-call-spread", name: "Bull Call Spread", category: "options", marketView: "Bullish",
        description: "Buy lower-strike call, sell higher-strike call. Capped risk and reward.",
        legs: [makeLeg("l1", "call", "buy", K1, p1), makeLeg("l2", "call", "sell", K2, p2)],
      };
    },
  },
  {
    id: "bear-put-spread",
    name: "Bear Put Spread",
    marketView: "Bearish",
    description: "Buy higher-strike put, sell lower-strike put. Defined-risk bearish trade.",
    build: (i) => {
      const spread = i.spread ?? 0.1;
      const K1 = i.spot * (1 - spread);
      const K2 = i.spot;
      const r = i.r ?? 0.03;
      const p1 = marketPremium("put", i.spot, K1, i.T, r, i.atmVol);
      const p2 = marketPremium("put", i.spot, K2, i.T, r, i.atmVol);
      return {
        id: "bear-put-spread", name: "Bear Put Spread", category: "options", marketView: "Bearish",
        description: "Buy higher-strike put, sell lower-strike put. Defined-risk bearish trade.",
        legs: [makeLeg("l1", "put", "sell", K1, p1), makeLeg("l2", "put", "buy", K2, p2)],
      };
    },
  },
  {
    id: "long-straddle",
    name: "Long Straddle",
    marketView: "Long Volatility",
    description: "Long call + long put at same strike. Profits from a big move either way.",
    build: (i) => {
      const K = i.spot;
      const r = i.r ?? 0.03;
      const pc = marketPremium("call", i.spot, K, i.T, r, i.atmVol);
      const pp = marketPremium("put", i.spot, K, i.T, r, i.atmVol);
      return {
        id: "long-straddle", name: "Long Straddle", category: "options", marketView: "Long Volatility",
        description: "Long call + long put at same strike. Profits from a big move either way.",
        legs: [makeLeg("l1", "call", "buy", K, pc), makeLeg("l2", "put", "buy", K, pp)],
      };
    },
  },
  {
    id: "long-strangle",
    name: "Long Strangle",
    marketView: "Long Volatility",
    description: "Long OTM call + long OTM put. Cheaper than straddle, needs bigger move.",
    build: (i) => {
      const spread = i.spread ?? 0.1;
      const Kc = i.spot * (1 + spread);
      const Kp = i.spot * (1 - spread);
      const r = i.r ?? 0.03;
      const pc = marketPremium("call", i.spot, Kc, i.T, r, i.atmVol);
      const pp = marketPremium("put", i.spot, Kp, i.T, r, i.atmVol);
      return {
        id: "long-strangle", name: "Long Strangle", category: "options", marketView: "Long Volatility",
        description: "Long OTM call + long OTM put. Cheaper than straddle, needs bigger move.",
        legs: [makeLeg("l1", "call", "buy", Kc, pc), makeLeg("l2", "put", "buy", Kp, pp)],
      };
    },
  },
  {
    id: "short-straddle",
    name: "Short Straddle",
    marketView: "Short Volatility",
    description: "Short call + short put at same strike. Income if range-bound. Undefined risk.",
    build: (i) => {
      const K = i.spot;
      const r = i.r ?? 0.03;
      const pc = marketPremium("call", i.spot, K, i.T, r, i.atmVol);
      const pp = marketPremium("put", i.spot, K, i.T, r, i.atmVol);
      return {
        id: "short-straddle", name: "Short Straddle", category: "options", marketView: "Short Volatility",
        description: "Short call + short put at same strike. Income if range-bound. Undefined risk.",
        legs: [makeLeg("l1", "call", "sell", K, pc), makeLeg("l2", "put", "sell", K, pp)],
      };
    },
  },
  {
    id: "risk-reversal",
    name: "Risk Reversal",
    marketView: "Bullish",
    description: "Long OTM call + short OTM put. Bullish, low net cost.",
    build: (i) => {
      const spread = i.spread ?? 0.1;
      const Kc = i.spot * (1 + spread);
      const Kp = i.spot * (1 - spread);
      const r = i.r ?? 0.03;
      const pc = marketPremium("call", i.spot, Kc, i.T, r, i.atmVol);
      const pp = marketPremium("put", i.spot, Kp, i.T, r, i.atmVol);
      return {
        id: "risk-reversal", name: "Risk Reversal", category: "options", marketView: "Bullish",
        description: "Long OTM call + short OTM put. Bullish, low net cost.",
        legs: [makeLeg("l1", "call", "buy", Kc, pc), makeLeg("l2", "put", "sell", Kp, pp)],
      };
    },
  },
  {
    id: "collar",
    name: "Collar",
    marketView: "Neutral",
    description: "Long stock + long put + short call. Zero-cost hedge.",
    build: (i) => {
      const spread = i.spread ?? 0.1;
      const Kc = i.spot * (1 + spread);
      const Kp = i.spot * (1 - spread);
      const r = i.r ?? 0.03;
      const pc = marketPremium("call", i.spot, Kc, i.T, r, i.atmVol);
      const pp = marketPremium("put", i.spot, Kp, i.T, r, i.atmVol);
      return {
        id: "collar", name: "Collar", category: "options", marketView: "Neutral",
        description: "Long stock + long put + short call. Zero-cost hedge.",
        legs: [makeLeg("l1", "put", "buy", Kp, pp), makeLeg("l2", "call", "sell", Kc, pc)],
        stock: { action: "buy", shares: 100, price: i.spot },
      };
    },
  },
  {
    id: "long-call-butterfly",
    name: "Long Call Butterfly",
    marketView: "Neutral",
    description: "Buy 1 ITM call, sell 2 ATM calls, buy 1 OTM call. Profits if pinned at middle strike.",
    build: (i) => {
      const spread = i.spread ?? 0.1;
      const K1 = i.spot * (1 - spread);
      const K2 = i.spot;
      const K3 = i.spot * (1 + spread);
      const r = i.r ?? 0.03;
      const p1 = marketPremium("call", i.spot, K1, i.T, r, i.atmVol);
      const p2 = marketPremium("call", i.spot, K2, i.T, r, i.atmVol);
      const p3 = marketPremium("call", i.spot, K3, i.T, r, i.atmVol);
      return {
        id: "long-call-butterfly", name: "Long Call Butterfly", category: "options", marketView: "Neutral",
        description: "Buy 1 ITM call, sell 2 ATM calls, buy 1 OTM call. Profits if pinned at middle strike.",
        legs: [
          makeLeg("l1", "call", "buy", K1, p1),
          makeLeg("l2", "call", "sell", K2, p2, 2),
          makeLeg("l3", "call", "buy", K3, p3),
        ],
      };
    },
  },
  {
    id: "long-iron-condor",
    name: "Long Iron Condor",
    marketView: "Neutral",
    description: "Bull put spread + bear call spread. Defined-risk range income.",
    build: (i) => {
      const spread = i.spread ?? 0.1;
      const wing = spread / 2;
      const K1 = i.spot * (1 - spread - wing);
      const K2 = i.spot * (1 - spread);
      const K3 = i.spot * (1 + spread);
      const K4 = i.spot * (1 + spread + wing);
      const r = i.r ?? 0.03;
      const p1 = marketPremium("put", i.spot, K1, i.T, r, i.atmVol);
      const p2 = marketPremium("put", i.spot, K2, i.T, r, i.atmVol);
      const p3 = marketPremium("call", i.spot, K3, i.T, r, i.atmVol);
      const p4 = marketPremium("call", i.spot, K4, i.T, r, i.atmVol);
      return {
        id: "long-iron-condor", name: "Long Iron Condor", category: "options", marketView: "Neutral",
        description: "Bull put spread + bear call spread. Defined-risk range income.",
        legs: [
          makeLeg("l1", "put", "buy", K1, p1),
          makeLeg("l2", "put", "sell", K2, p2),
          makeLeg("l3", "call", "sell", K3, p3),
          makeLeg("l4", "call", "buy", K4, p4),
        ],
      };
    },
  },
  {
    id: "call-ratio-backspread",
    name: "Call Ratio Backspread",
    marketView: "Bullish",
    description: "Short 1 lower call, long 2 higher calls. Bullish with vol upside.",
    build: (i) => {
      const spread = i.spread ?? 0.1;
      const K1 = i.spot;
      const K2 = i.spot * (1 + spread);
      const r = i.r ?? 0.03;
      const p1 = marketPremium("call", i.spot, K1, i.T, r, i.atmVol);
      const p2 = marketPremium("call", i.spot, K2, i.T, r, i.atmVol);
      return {
        id: "call-ratio-backspread", name: "Call Ratio Backspread", category: "options", marketView: "Bullish",
        description: "Short 1 lower call, long 2 higher calls. Bullish with vol upside.",
        legs: [makeLeg("l1", "call", "sell", K1, p1), makeLeg("l2", "call", "buy", K2, p2, 2)],
      };
    },
  },
];

export function getPresetById(id: string) {
  return OPTION_PRESETS.find((p) => p.id === id);
}

// Wrapper exports for test compatibility
export const OPTIONS_PRESETS = OPTION_PRESETS;

export function getPreset(id: string) {
  return getPresetById(id);
}

export function blackScholes(params: { S: number; K: number; T: number; r: number; sigma: number; isCall: boolean }): number {
  return bsPrice(params.isCall ? "call" : "put", params.S, params.K, params.T, params.r, params.sigma);
}

export function blackScholesGreeks(params: { S: number; K: number; T: number; r: number; sigma: number; isCall: boolean }) {
  const type = params.isCall ? "call" : "put";
  return {
    delta: bsDelta(type, params.S, params.K, params.T, params.r, params.sigma),
    gamma: bsGamma(params.S, params.K, params.T, params.r, params.sigma),
    vega: bsVega(params.S, params.K, params.T, params.r, params.sigma),
    theta: bsTheta(type, params.S, params.K, params.T, params.r, params.sigma),
    rho: 0, // Not computed by bs functions
  };
}

export function computePayoffAtExpiry(S: number, legs: OptionLeg[], stockPrice: number): number {
  let payoff = legs.reduce((sum, leg) => sum + legPayoffAtExpiry(leg, S), 0);
  if (stockPrice > 0) {
    payoff += (S - stockPrice); // stock leg assumed buy 1 share
  }
  return payoff;
}

export function findBreakevens(legs: OptionLeg[], stockPrice = 0): number[] {
  // Use buildPayoffCurve with a temp strategy
  const strategy: OptionsStrategy = {
    id: "temp",
    name: "temp",
    category: "test",
    marketView: "neutral",
    description: "test",
    legs,
    stock: stockPrice > 0 ? { action: "buy", shares: 1, price: stockPrice } : undefined,
  };
  const { breakevens } = buildPayoffCurve(strategy, 100, { rangePct: 0.5, steps: 200 });
  return breakevens;
}
