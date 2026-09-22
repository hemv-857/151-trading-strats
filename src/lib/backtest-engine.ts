// Backtest computation engine - synthetic price generation + strategy execution
// Uses geometric Brownian motion with optional regime features for realistic simulation.

export interface PricePoint {
  t: number;        // index
  date: string;     // label
  price: number;
}

export interface EquityPoint {
  t: number;
  date: string;
  equity: number;
  benchmark: number;
  position: number; // -1, 0, 1 (or fractional)
}

export interface TradeRecord {
  entryIdx: number;
  exitIdx: number;
  side: "long" | "short" | "flat";
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  returnPct: number;
}

export interface BacktestMetrics {
  totalReturn: number;
  cagr: number;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  volatility: number;
  winRate: number;
  numTrades: number;
  benchmarkReturn: number;
  alpha: number;
  avgTradeReturn: number;
  calmar: number;
}

export interface BacktestResult {
  equity: EquityPoint[];
  trades: TradeRecord[];
  metrics: BacktestMetrics;
  signals: { t: number; date: string; price: number; signal: number }[];
  params: Record<string, number | string>;
  strategyId: string;
  strategyName: string;
}

export interface PriceSeries {
  points: PricePoint[];
  symbol: string;
}

// Mulberry32 seeded PRNG for reproducibility
export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller transform for standard normal
export function gaussian(rand: () => number) {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Generate synthetic price series via GBM with optional trend/vol regime shifts
export function generatePriceSeries(opts: {
  symbol: string;
  bars: number;
  startPrice: number;
  drift: number;      // annual drift
  volatility: number; // annual vol
  seed: number;
  regimeShifts?: number; // number of regime shifts
}): PriceSeries {
  const { symbol, bars, startPrice, drift, volatility, seed, regimeShifts = 2 } = opts;
  const rand = mulberry32(seed);
  const dt = 1 / 252;
  const prices: number[] = [startPrice];
  const dates: string[] = [dateLabel(0)];

  // Build regime schedule
  const shiftPoints = new Set<number>();
  for (let i = 0; i < regimeShifts; i++) {
    shiftPoints.add(Math.floor(rand() * (bars - 100)) + 50);
  }
  let curDrift = drift;
  let curVol = volatility;

  for (let i = 1; i < bars; i++) {
    if (shiftPoints.has(i)) {
      // randomly perturb drift and vol
      curDrift = drift + (rand() - 0.5) * 0.3;
      curVol = volatility * (0.6 + rand() * 0.9);
    }
    const z = gaussian(rand);
    const ret = (curDrift - 0.5 * curVol * curVol) * dt + curVol * Math.sqrt(dt) * z;
    prices.push(prices[i - 1] * Math.exp(ret));
    dates.push(dateLabel(i));
  }

  return {
    symbol,
    points: prices.map((p, i) => ({ t: i, date: dates[i], price: p })),
  };
}

// Generate two cointegrated series for pairs trading
export function generateCointegratedPair(opts: {
  symbolA: string;
  symbolB: string;
  bars: number;
  startA: number;
  startB: number;
  beta: number;       // cointegration coefficient
  volatility: number;
  seed: number;
}): { a: PriceSeries; b: PriceSeries } {
  const { symbolA, symbolB, bars, startA, startB, beta, volatility, seed } = opts;
  const rand = mulberry32(seed);
  const dt = 1 / 252;
  // Common random walk + spread mean-reverting around 0
  let pa = startA;
  let pb = startB;
  let spread = 0;
  const pricesA: number[] = [pa];
  const pricesB: number[] = [pb];
  const dates: string[] = [dateLabel(0)];
  const spreadKappa = 0.15; // mean reversion speed
  const spreadVol = volatility * 0.4;

  for (let i = 1; i < bars; i++) {
    const commonShock = gaussian(rand) * volatility * Math.sqrt(dt) * 0.6;
    const spreadShock = gaussian(rand) * spreadVol * Math.sqrt(dt);
    spread = spread * (1 - spreadKappa) + spreadShock;
    pa = pa * Math.exp((0.08 - 0.5 * volatility * volatility) * dt + commonShock + spread / 2);
    pb = pb * Math.exp((0.07 - 0.5 * volatility * volatility) * dt + commonShock * beta - spread / (2 * beta));
    pricesA.push(pa);
    pricesB.push(pb);
    dates.push(dateLabel(i));
  }

  return {
    a: { symbol: symbolA, points: pricesA.map((p, i) => ({ t: i, date: dates[i], price: p })) },
    b: { symbol: symbolB, points: pricesB.map((p, i) => ({ t: i, date: dates[i], price: p })) },
  };
}

function dateLabel(t: number): string {
  // Synthetic date: assume ~252 trading days per year, start Jan 1 2020
  const start = new Date(2020, 0, 1);
  const d = new Date(start.getTime() + t * 86400000 * 1.4);
  return d.toISOString().slice(0, 10);
}

// ---------- Indicators ----------
export function sma(prices: number[], window: number): (number | null)[] {
  const out: (number | null)[] = new Array(prices.length).fill(null);
  let sum = 0;
  for (let i = 0; i < prices.length; i++) {
    sum += prices[i];
    if (i >= window) sum -= prices[i - window];
    if (i >= window - 1) out[i] = sum / window;
  }
  return out;
}

export function rollingStd(prices: number[], window: number): (number | null)[] {
  const out: (number | null)[] = new Array(prices.length).fill(null);
  const means = sma(prices, window);
  for (let i = window - 1; i < prices.length; i++) {
    let s = 0;
    const m = means[i]!;
    for (let j = i - window + 1; j <= i; j++) s += (prices[j] - m) ** 2;
    out[i] = Math.sqrt(s / window);
  }
  return out;
}

export function donchianChannel(prices: number[], window: number): { upper: (number | null)[]; lower: (number | null)[] } {
  const upper: (number | null)[] = new Array(prices.length).fill(null);
  const lower: (number | null)[] = new Array(prices.length).fill(null);
  for (let i = window - 1; i < prices.length; i++) {
    let hi = -Infinity, lo = Infinity;
    for (let j = i - window + 1; j <= i; j++) {
      if (prices[j] > hi) hi = prices[j];
      if (prices[j] < lo) lo = prices[j];
    }
    upper[i] = hi;
    lower[i] = lo;
  }
  return { upper, lower };
}

export function zscore(prices: number[], window: number): (number | null)[] {
  const m = sma(prices, window);
  const s = rollingStd(prices, window);
  return prices.map((p, i) => (m[i] !== null && s[i] !== null && s[i]! > 0 ? (p - m[i]!) / s[i]! : null));
}

// Exponential moving average
export function ema(prices: number[], window: number): (number | null)[] {
  const out: (number | null)[] = new Array(prices.length).fill(null);
  const k = 2 / (window + 1);
  let prev: number | null = null;
  // Seed with SMA of first `window` values
  let sum = 0;
  for (let i = 0; i < prices.length; i++) {
    sum += prices[i];
    if (i === window - 1) {
      prev = sum / window;
      out[i] = prev;
    } else if (i >= window) {
      prev = prices[i] * k + (prev as number) * (1 - k);
      out[i] = prev;
    }
  }
  return out;
}

// Relative Strength Index (Wilder's smoothing)
export function rsi(prices: number[], window: number): (number | null)[] {
  const out: (number | null)[] = new Array(prices.length).fill(null);
  if (prices.length <= window) return out;
  let gains = 0, losses = 0;
  for (let i = 1; i <= window; i++) {
    const ch = prices[i] - prices[i - 1];
    if (ch >= 0) gains += ch; else losses -= ch;
  }
  let avgGain = gains / window;
  let avgLoss = losses / window;
  out[window] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = window + 1; i < prices.length; i++) {
    const ch = prices[i] - prices[i - 1];
    const g = ch > 0 ? ch : 0;
    const l = ch < 0 ? -ch : 0;
    avgGain = (avgGain * (window - 1) + g) / window;
    avgLoss = (avgLoss * (window - 1) + l) / window;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

// Bollinger Bands: middle = SMA, upper/lower = middle ± k * std
export function bollingerBands(prices: number[], window: number, k: number): { middle: (number | null)[]; upper: (number | null)[]; lower: (number | null)[] } {
  const middle = sma(prices, window);
  const std = rollingStd(prices, window);
  const upper: (number | null)[] = new Array(prices.length).fill(null);
  const lower: (number | null)[] = new Array(prices.length).fill(null);
  for (let i = 0; i < prices.length; i++) {
    if (middle[i] !== null && std[i] !== null) {
      upper[i] = (middle[i] as number) + k * (std[i] as number);
      lower[i] = (middle[i] as number) - k * (std[i] as number);
    }
  }
  return { middle, upper, lower };
}

// MACD: fast EMA - slow EMA, signal = EMA of MACD, histogram = MACD - signal
export function macd(prices: number[], fast: number, slow: number, signal: number): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const fastEma = ema(prices, fast);
  const slowEma = ema(prices, slow);
  const macdLine: (number | null)[] = prices.map((_, i) =>
    fastEma[i] !== null && slowEma[i] !== null ? (fastEma[i] as number) - (slowEma[i] as number) : null
  );
  // Build signal line: EMA of the MACD values (only where non-null)
  const macdValues: number[] = [];
  const startIndex = macdLine.findIndex((v) => v !== null);
  for (let i = startIndex; i < prices.length; i++) macdValues.push(macdLine[i] as number);
  const signalRaw = ema(macdValues, signal);
  const signalLine: (number | null)[] = new Array(prices.length).fill(null);
  for (let i = 0; i < macdValues.length; i++) signalLine[startIndex + i] = signalRaw[i];
  const histogram: (number | null)[] = prices.map((_, i) =>
    macdLine[i] !== null && signalLine[i] !== null ? (macdLine[i] as number) - (signalLine[i] as number) : null
  );
  return { macd: macdLine, signal: signalLine, histogram };
}

// ---------- Strategy backtest engines ----------
interface BaseParams {
  bars: number;
  startPrice: number;
  drift: number;
  volatility: number;
  seed: number;
  initialCapital: number;
}

export function computeMetrics(equityCurve: number[], benchmark: number[], trades: TradeRecord[], periods: number): BacktestMetrics {
  const n = equityCurve.length;
  const totalReturn = equityCurve[n - 1] / equityCurve[0] - 1;
  const benchmarkReturn = benchmark[n - 1] / benchmark[0] - 1;
  const years = periods / 252;
  const cagr = Math.pow(equityCurve[n - 1] / equityCurve[0], 1 / Math.max(years, 0.01)) - 1;

  // Daily returns
  const dailyReturns: number[] = [];
  for (let i = 1; i < n; i++) dailyReturns.push(equityCurve[i] / equityCurve[i - 1] - 1);

  const meanRet = dailyReturns.reduce((a, b) => a + b, 0) / Math.max(dailyReturns.length, 1);
  const stdRet = Math.sqrt(dailyReturns.reduce((a, b) => a + (b - meanRet) ** 2, 0) / Math.max(dailyReturns.length, 1));
  const sharpe = stdRet > 0 ? (meanRet / stdRet) * Math.sqrt(252) : 0;

  const downside = dailyReturns.filter((r) => r < 0);
  const downsideStd = Math.sqrt(downside.reduce((a, b) => a + b * b, 0) / Math.max(downside.length, 1));
  const sortino = downsideStd > 0 ? (meanRet / downsideStd) * Math.sqrt(252) : 0;

  let peak = equityCurve[0];
  let maxDD = 0;
  for (const v of equityCurve) {
    if (v > peak) peak = v;
    const dd = (peak - v) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  const calmar = maxDD > 0 ? cagr / maxDD : 0;

  const winTrades = trades.filter((t) => t.pnl > 0).length;
  const winRate = trades.length > 0 ? winTrades / trades.length : 0;
  const alpha = totalReturn - benchmarkReturn;
  const avgTradeReturn = trades.length > 0 ? trades.reduce((a, b) => a + b.returnPct, 0) / trades.length : 0;

  return {
    totalReturn,
    cagr,
    sharpe,
    sortino,
    maxDrawdown: maxDD,
    volatility: stdRet * Math.sqrt(252),
    winRate,
    numTrades: trades.length,
    benchmarkReturn,
    alpha,
    avgTradeReturn,
    calmar,
  };
}

export function runPositionStrategy(
  prices: number[],
  dates: string[],
  positions: number[], // -1..1 per bar
  benchmark: number[],
  initialCapital: number,
  periods: number,
): { equity: number[]; trades: TradeRecord[] } {
  const n = prices.length;
  const equity: number[] = new Array(n).fill(initialCapital);
  const trades: TradeRecord[] = [];

  // Strategy returns = position_prev * daily asset return
  for (let i = 1; i < n; i++) {
    const assetRet = prices[i] / prices[i - 1] - 1;
    const pos = positions[i - 1];
    const stratRet = pos * assetRet;
    equity[i] = equity[i - 1] * (1 + stratRet);
  }

  // Extract trades (round trips)
  let curSide: "long" | "short" | "flat" = "flat";
  let entryIdx = -1;
  for (let i = 0; i <= n; i++) {
    const pos = i < n ? positions[i] : 0;
    const side: "long" | "short" | "flat" = pos > 0.01 ? "long" : pos < -0.01 ? "short" : "flat";
    if (side !== curSide) {
      if (curSide !== "flat" && entryIdx >= 0) {
        const exitIdx = i - 1;
        const entryPrice = prices[entryIdx];
        const exitPrice = prices[exitIdx];
        const dir = curSide === "long" ? 1 : -1;
        const pnl = dir * (exitPrice - entryPrice) * (initialCapital / prices[entryIdx]);
        trades.push({
          entryIdx,
          exitIdx,
          side: curSide,
          entryPrice,
          exitPrice,
          pnl,
          returnPct: dir * (exitPrice / entryPrice - 1),
        });
      }
      if (side !== "flat") entryIdx = i;
      curSide = side;
    }
  }

  return { equity, trades };
}

// ---- Single MA ----
export function backtestSingleMA(params: BaseParams & { maWindow: number }): BacktestResult {
  const series = generatePriceSeries({
    symbol: "ASSET",
    bars: params.bars,
    startPrice: params.startPrice,
    drift: params.drift,
    volatility: params.volatility,
    seed: params.seed,
  });
  const prices = series.points.map((p) => p.price);
  const dates = series.points.map((p) => p.date);
  const ma = sma(prices, params.maWindow);

  const positions = prices.map((p, i) => (ma[i] !== null ? (p > (ma[i] as number) ? 1 : 0) : 0));
  const benchmark = prices.map((p) => p / prices[0] * params.initialCapital);
  const { equity, trades } = runPositionStrategy(prices, dates, positions, benchmark, params.initialCapital, params.bars);

  return {
    equity: equity.map((e, i) => ({ t: i, date: dates[i], equity: e, benchmark: benchmark[i], position: positions[i] })),
    trades,
    metrics: computeMetrics(equity, benchmark, trades, params.bars),
    signals: prices.map((p, i) => ({ t: i, date: dates[i], price: p, signal: positions[i] })),
    params: { maWindow: params.maWindow, bars: params.bars, drift: params.drift, volatility: params.volatility, seed: params.seed },
    strategyId: "single-moving-average",
    strategyName: "Single Moving Average",
  };
}

// ---- Two MA crossover ----
export function backtestTwoMA(params: BaseParams & { fastWindow: number; slowWindow: number }): BacktestResult {
  const series = generatePriceSeries({
    symbol: "ASSET",
    bars: params.bars,
    startPrice: params.startPrice,
    drift: params.drift,
    volatility: params.volatility,
    seed: params.seed,
  });
  const prices = series.points.map((p) => p.price);
  const dates = series.points.map((p) => p.date);
  const fast = sma(prices, params.fastWindow);
  const slow = sma(prices, params.slowWindow);

  const positions = prices.map((_, i) =>
    fast[i] !== null && slow[i] !== null ? ((fast[i] as number) > (slow[i] as number) ? 1 : -1) : 0
  );
  const benchmark = prices.map((p) => p / prices[0] * params.initialCapital);
  const { equity, trades } = runPositionStrategy(prices, dates, positions, benchmark, params.initialCapital, params.bars);

  return {
    equity: equity.map((e, i) => ({ t: i, date: dates[i], equity: e, benchmark: benchmark[i], position: positions[i] })),
    trades,
    metrics: computeMetrics(equity, benchmark, trades, params.bars),
    signals: prices.map((p, i) => ({ t: i, date: dates[i], price: p, signal: positions[i] })),
    params: { fastWindow: params.fastWindow, slowWindow: params.slowWindow, bars: params.bars, drift: params.drift, volatility: params.volatility, seed: params.seed },
    strategyId: "two-moving-averages",
    strategyName: "Two Moving Averages (Golden/Death Cross)",
  };
}

// ---- Three MA stacked ----
export function backtestThreeMA(params: BaseParams & { w1: number; w2: number; w3: number }): BacktestResult {
  const series = generatePriceSeries({
    symbol: "ASSET",
    bars: params.bars,
    startPrice: params.startPrice,
    drift: params.drift,
    volatility: params.volatility,
    seed: params.seed,
  });
  const prices = series.points.map((p) => p.price);
  const dates = series.points.map((p) => p.date);
  const m1 = sma(prices, params.w1);
  const m2 = sma(prices, params.w2);
  const m3 = sma(prices, params.w3);

  const positions = prices.map((_, i) => {
    if (m1[i] === null || m2[i] === null || m3[i] === null) return 0;
    const bullish = (m1[i] as number) > (m2[i] as number) && (m2[i] as number) > (m3[i] as number);
    const bearish = (m1[i] as number) < (m2[i] as number) && (m2[i] as number) < (m3[i] as number);
    return bullish ? 1 : bearish ? -1 : 0;
  });
  const benchmark = prices.map((p) => p / prices[0] * params.initialCapital);
  const { equity, trades } = runPositionStrategy(prices, dates, positions, benchmark, params.initialCapital, params.bars);

  return {
    equity: equity.map((e, i) => ({ t: i, date: dates[i], equity: e, benchmark: benchmark[i], position: positions[i] })),
    trades,
    metrics: computeMetrics(equity, benchmark, trades, params.bars),
    signals: prices.map((p, i) => ({ t: i, date: dates[i], price: p, signal: positions[i] })),
    params: { w1: params.w1, w2: params.w2, w3: params.w3, bars: params.bars, drift: params.drift, volatility: params.volatility, seed: params.seed },
    strategyId: "three-moving-averages",
    strategyName: "Three Moving Averages (Stacked)",
  };
}

// ---- Donchian Channel breakout ----
export function backtestChannelBreakout(params: BaseParams & { window: number }): BacktestResult {
  const series = generatePriceSeries({
    symbol: "ASSET",
    bars: params.bars,
    startPrice: params.startPrice,
    drift: params.drift,
    volatility: params.volatility,
    seed: params.seed,
  });
  const prices = series.points.map((p) => p.price);
  const dates = series.points.map((p) => p.date);
  const { upper, lower } = donchianChannel(prices, params.window);

  let pos = 0;
  const positions = prices.map((p, i) => {
    if (i === 0 || upper[i] === null || lower[i] === null) return 0;
    // Use previous bar's channel for breakout detection
    if (p > (upper[i - 1] ?? 0)) pos = 1;
    else if (p < (lower[i - 1] ?? Infinity)) pos = -1;
    return pos;
  });
  const benchmark = prices.map((p) => p / prices[0] * params.initialCapital);
  const { equity, trades } = runPositionStrategy(prices, dates, positions, benchmark, params.initialCapital, params.bars);

  return {
    equity: equity.map((e, i) => ({ t: i, date: dates[i], equity: e, benchmark: benchmark[i], position: positions[i] })),
    trades,
    metrics: computeMetrics(equity, benchmark, trades, params.bars),
    signals: prices.map((p, i) => ({ t: i, date: dates[i], price: p, signal: positions[i] })),
    params: { window: params.window, bars: params.bars, drift: params.drift, volatility: params.volatility, seed: params.seed },
    strategyId: "channel",
    strategyName: "Channel Breakout (Donchian)",
  };
}

// ---- Mean reversion (Z-score fade) ----
export function backtestMeanReversion(params: BaseParams & { window: number; entryZ: number; exitZ: number }): BacktestResult {
  const series = generatePriceSeries({
    symbol: "ASSET",
    bars: params.bars,
    startPrice: params.startPrice,
    drift: params.drift,
    volatility: params.volatility,
    seed: params.seed,
  });
  const prices = series.points.map((p) => p.price);
  const dates = series.points.map((p) => p.date);
  const z = zscore(prices, params.window);

  let pos = 0;
  const positions = prices.map((_, i) => {
    if (z[i] === null) return 0;
    const zv = z[i] as number;
    if (pos === 0) {
      if (zv < -params.entryZ) pos = 1;       // oversold → buy
      else if (zv > params.entryZ) pos = -1;  // overbought → sell
    } else {
      if (pos === 1 && zv > -params.exitZ) pos = 0;
      else if (pos === -1 && zv < params.exitZ) pos = 0;
    }
    return pos;
  });
  const benchmark = prices.map((p) => p / prices[0] * params.initialCapital);
  const { equity, trades } = runPositionStrategy(prices, dates, positions, benchmark, params.initialCapital, params.bars);

  return {
    equity: equity.map((e, i) => ({ t: i, date: dates[i], equity: e, benchmark: benchmark[i], position: positions[i] })),
    trades,
    metrics: computeMetrics(equity, benchmark, trades, params.bars),
    signals: prices.map((p, i) => ({ t: i, date: dates[i], price: p, signal: positions[i] })),
    params: { window: params.window, entryZ: params.entryZ, exitZ: params.exitZ, bars: params.bars, drift: params.drift, volatility: params.volatility, seed: params.seed },
    strategyId: "etf-mean-reversion",
    strategyName: "Mean Reversion (Z-Score Fade)",
  };
}

// ---- Momentum (rate of change rank) ----
export function backtestMomentum(params: BaseParams & { lookback: number; holdPeriod: number }): BacktestResult {
  const series = generatePriceSeries({
    symbol: "ASSET",
    bars: params.bars,
    startPrice: params.startPrice,
    drift: params.drift,
    volatility: params.volatility,
    seed: params.seed,
  });
  const prices = series.points.map((p) => p.price);
  const dates = series.points.map((p) => p.date);

  // Compute momentum (rate of change) and trade based on its sign and magnitude
  const positions = prices.map((_, i) => {
    if (i < params.lookback) return 0;
    const roc = prices[i] / prices[i - params.lookback] - 1;
    // Threshold to avoid noise
    if (roc > 0.02) return 1;
    if (roc < -0.02) return -1;
    return 0;
  });
  const benchmark = prices.map((p) => p / prices[0] * params.initialCapital);
  const { equity, trades } = runPositionStrategy(prices, dates, positions, benchmark, params.initialCapital, params.bars);

  return {
    equity: equity.map((e, i) => ({ t: i, date: dates[i], equity: e, benchmark: benchmark[i], position: positions[i] })),
    trades,
    metrics: computeMetrics(equity, benchmark, trades, params.bars),
    signals: prices.map((p, i) => ({ t: i, date: dates[i], price: p, signal: positions[i] })),
    params: { lookback: params.lookback, holdPeriod: params.holdPeriod, bars: params.bars, drift: params.drift, volatility: params.volatility, seed: params.seed },
    strategyId: "price-momentum",
    strategyName: "Price Momentum (Rate of Change)",
  };
}

// ---- Bollinger Bands mean-reversion ----
export function backtestBollingerBands(params: BaseParams & { window: number; k: number; entryZ: number; exitZ: number }): BacktestResult {
  const series = generatePriceSeries({
    symbol: "ASSET",
    bars: params.bars,
    startPrice: params.startPrice,
    drift: params.drift,
    volatility: params.volatility,
    seed: params.seed,
  });
  const prices = series.points.map((p) => p.price);
  const dates = series.points.map((p) => p.date);
  const { upper, lower, middle } = bollingerBands(prices, params.window, params.k);

  let pos = 0;
  const positions = prices.map((_, i) => {
    if (upper[i] === null || lower[i] === null || middle[i] === null) return 0;
    const u = upper[i] as number;
    const l = lower[i] as number;
    const m = middle[i] as number;
    if (pos === 0) {
      if (prices[i] <= l) pos = 1;        // touch lower band → buy
      else if (prices[i] >= u) pos = -1;   // touch upper band → sell
    } else {
      // Exit when reverting to middle
      if (pos === 1 && prices[i] >= m) pos = 0;
      else if (pos === -1 && prices[i] <= m) pos = 0;
    }
    return pos;
  });
  const benchmark = prices.map((p) => p / prices[0] * params.initialCapital);
  const { equity, trades } = runPositionStrategy(prices, dates, positions, benchmark, params.initialCapital, params.bars);

  return {
    equity: equity.map((e, i) => ({ t: i, date: dates[i], equity: e, benchmark: benchmark[i], position: positions[i] })),
    trades,
    metrics: computeMetrics(equity, benchmark, trades, params.bars),
    signals: prices.map((p, i) => ({ t: i, date: dates[i], price: p, signal: positions[i] })),
    params: { window: params.window, k: params.k, entryZ: params.entryZ, exitZ: params.exitZ, bars: params.bars, drift: params.drift, volatility: params.volatility, seed: params.seed },
    strategyId: "bollinger-bands",
    strategyName: "Bollinger Bands Mean-Reversion",
  };
}

// ---- RSI mean-reversion ----
export function backtestRSI(params: BaseParams & { window: number; oversold: number; overbought: number; exitMid: number }): BacktestResult {
  const series = generatePriceSeries({
    symbol: "ASSET",
    bars: params.bars,
    startPrice: params.startPrice,
    drift: params.drift,
    volatility: params.volatility,
    seed: params.seed,
  });
  const prices = series.points.map((p) => p.price);
  const dates = series.points.map((p) => p.date);
  const rsiArr = rsi(prices, params.window);

  let pos = 0;
  const positions = prices.map((_, i) => {
    if (rsiArr[i] === null) return 0;
    const r = rsiArr[i] as number;
    if (pos === 0) {
      if (r <= params.oversold) pos = 1;        // oversold → buy
      else if (r >= params.overbought) pos = -1; // overbought → sell
    } else {
      if (pos === 1 && r >= params.exitMid) pos = 0;     // exit long when RSI rebounds
      else if (pos === -1 && r <= params.exitMid) pos = 0; // exit short when RSI dips
    }
    return pos;
  });
  const benchmark = prices.map((p) => p / prices[0] * params.initialCapital);
  const { equity, trades } = runPositionStrategy(prices, dates, positions, benchmark, params.initialCapital, params.bars);

  return {
    equity: equity.map((e, i) => ({ t: i, date: dates[i], equity: e, benchmark: benchmark[i], position: positions[i] })),
    trades,
    metrics: computeMetrics(equity, benchmark, trades, params.bars),
    signals: prices.map((p, i) => ({ t: i, date: dates[i], price: p, signal: positions[i] })),
    params: { window: params.window, oversold: params.oversold, overbought: params.overbought, exitMid: params.exitMid, bars: params.bars, drift: params.drift, volatility: params.volatility, seed: params.seed },
    strategyId: "rsi-mean-reversion",
    strategyName: "RSI Mean-Reversion",
  };
}

// ---- MACD crossover ----
export function backtestMACD(params: BaseParams & { fast: number; slow: number; signal: number }): BacktestResult {
  const series = generatePriceSeries({
    symbol: "ASSET",
    bars: params.bars,
    startPrice: params.startPrice,
    drift: params.drift,
    volatility: params.volatility,
    seed: params.seed,
  });
  const prices = series.points.map((p) => p.price);
  const dates = series.points.map((p) => p.date);
  const { macd: macdLine, signal: signalLine } = macd(prices, params.fast, params.slow, params.signal);

  let pos = 0;
  const positions = prices.map((_, i) => {
    if (macdLine[i] === null || signalLine[i] === null) return 0;
    const m = macdLine[i] as number;
    const s = signalLine[i] as number;
    // Bullish crossover (MACD crosses above signal) → long
    if (m > s) pos = 1;
    // Bearish crossover → short
    else if (m < s) pos = -1;
    return pos;
  });
  const benchmark = prices.map((p) => p / prices[0] * params.initialCapital);
  const { equity, trades } = runPositionStrategy(prices, dates, positions, benchmark, params.initialCapital, params.bars);

  return {
    equity: equity.map((e, i) => ({ t: i, date: dates[i], equity: e, benchmark: benchmark[i], position: positions[i] })),
    trades,
    metrics: computeMetrics(equity, benchmark, trades, params.bars),
    signals: prices.map((p, i) => ({ t: i, date: dates[i], price: p, signal: positions[i] })),
    params: { fast: params.fast, slow: params.slow, signal: params.signal, bars: params.bars, drift: params.drift, volatility: params.volatility, seed: params.seed },
    strategyId: "macd-crossover",
    strategyName: "MACD Crossover",
  };
}

// ---- Pairs trading (cointegration spread) ----
export function backtestPairsTrading(params: {
  bars: number;
  startA: number;
  startB: number;
  beta: number;
  volatility: number;
  seed: number;
  initialCapital: number;
  window: number;
  entryZ: number;
  exitZ: number;
}): BacktestResult {
  const pair = generateCointegratedPair({
    symbolA: "STOCK_A",
    symbolB: "STOCK_B",
    bars: params.bars,
    startA: params.startA,
    startB: params.startB,
    beta: params.beta,
    volatility: params.volatility,
    seed: params.seed,
  });
  const pricesA = pair.a.points.map((p) => p.price);
  const pricesB = pair.b.points.map((p) => p.price);
  const dates = pair.a.points.map((p) => p.date);

  // Spread = log(A) - beta*log(B)
  const spread = pricesA.map((pa, i) => Math.log(pa) - params.beta * Math.log(pricesB[i]));
  const spreadZ = zscore(spread, params.window);

  let pos = 0; // 1 = long spread (long A, short B), -1 = short spread
  const positions = spread.map((_, i) => {
    if (spreadZ[i] === null) return 0;
    const zv = spreadZ[i] as number;
    if (pos === 0) {
      if (zv > params.entryZ) pos = -1; // spread too high → short A, long B
      else if (zv < -params.entryZ) pos = 1; // spread too low → long A, short B
    } else {
      if (pos === -1 && zv < params.exitZ) pos = 0;
      else if (pos === 1 && zv > -params.exitZ) pos = 0;
    }
    return pos;
  });

  // Equity from spread returns (dollar-neutral)
  const returnsA = pricesA.map((p, i) => (i === 0 ? 0 : p / pricesA[i - 1] - 1));
  const returnsB = pricesB.map((p, i) => (i === 0 ? 0 : p / pricesB[i - 1] - 1));
  const equity: number[] = new Array(params.bars).fill(params.initialCapital);
  for (let i = 1; i < params.bars; i++) {
    // dollar-neutral: long $X A, short $X B → strategy return = pos*(retA - retB)
    const stratRet = positions[i - 1] * (returnsA[i] - returnsB[i]);
    equity[i] = equity[i - 1] * (1 + stratRet * 0.5); // 0.5 = half leverage per leg
  }

  const benchmark = pricesA.map((p, i) => p / pricesA[0] * params.initialCapital);
  const metrics = computeMetrics(equity, benchmark, [], params.bars);

  return {
    equity: equity.map((e, i) => ({ t: i, date: dates[i], equity: e, benchmark: benchmark[i], position: positions[i] })),
    trades: [],
    metrics,
    signals: spread.map((s, i) => ({ t: i, date: dates[i], price: s, signal: positions[i] })),
    params: { window: params.window, entryZ: params.entryZ, exitZ: params.exitZ, beta: params.beta, bars: params.bars, volatility: params.volatility, seed: params.seed },
    strategyId: "pairs-trading",
    strategyName: "Pairs Trading (Cointegration Spread)",
  };
}

// Registry of backtestable strategies
export interface BacktestDef {
  id: string;
  name: string;
  description: string;
  params: { key: string; label: string; min: number; max: number; step: number; default: number; unit?: string }[];
  run: (params: any) => BacktestResult;
}

export const BACKTEST_STRATEGIES: BacktestDef[] = [
  {
    id: "single-moving-average",
    name: "Single Moving Average",
    description: "Go long when price is above its N-day moving average; flat otherwise. Captures regime shifts.",
    params: [
      { key: "maWindow", label: "MA Window", min: 5, max: 200, step: 1, default: 50, unit: "days" },
      { key: "bars", label: "Bars", min: 100, max: 1500, step: 50, default: 750 },
      { key: "drift", label: "Drift", min: -0.2, max: 0.3, step: 0.01, default: 0.08 },
      { key: "volatility", label: "Volatility", min: 0.05, max: 0.6, step: 0.01, default: 0.2 },
      { key: "seed", label: "Random Seed", min: 1, max: 999, step: 1, default: 42 },
    ],
    run: (p) => backtestSingleMA({ ...p, startPrice: 100, initialCapital: 100000 }),
  },
  {
    id: "two-moving-averages",
    name: "Two Moving Averages (Golden/Death Cross)",
    description: "Long when fast MA above slow MA, short when below. The classic golden/death cross system.",
    params: [
      { key: "fastWindow", label: "Fast MA", min: 5, max: 100, step: 1, default: 50, unit: "days" },
      { key: "slowWindow", label: "Slow MA", min: 50, max: 300, step: 1, default: 200, unit: "days" },
      { key: "bars", label: "Bars", min: 100, max: 1500, step: 50, default: 750 },
      { key: "drift", label: "Drift", min: -0.2, max: 0.3, step: 0.01, default: 0.08 },
      { key: "volatility", label: "Volatility", min: 0.05, max: 0.6, step: 0.01, default: 0.2 },
      { key: "seed", label: "Random Seed", min: 1, max: 999, step: 1, default: 42 },
    ],
    run: (p) => backtestTwoMA({ ...p, startPrice: 100, initialCapital: 100000 }),
  },
  {
    id: "three-moving-averages",
    name: "Three Moving Averages (Stacked)",
    description: "Long only when fast > medium > slow (bullish stack). Reduces false signals.",
    params: [
      { key: "w1", label: "Fast MA", min: 5, max: 50, step: 1, default: 10, unit: "days" },
      { key: "w2", label: "Medium MA", min: 20, max: 100, step: 1, default: 50, unit: "days" },
      { key: "w3", label: "Slow MA", min: 100, max: 300, step: 1, default: 200, unit: "days" },
      { key: "bars", label: "Bars", min: 100, max: 1500, step: 50, default: 750 },
      { key: "drift", label: "Drift", min: -0.2, max: 0.3, step: 0.01, default: 0.08 },
      { key: "volatility", label: "Volatility", min: 0.05, max: 0.6, step: 0.01, default: 0.2 },
      { key: "seed", label: "Random Seed", min: 1, max: 999, step: 1, default: 42 },
    ],
    run: (p) => backtestThreeMA({ ...p, startPrice: 100, initialCapital: 100000 }),
  },
  {
    id: "channel",
    name: "Channel Breakout (Donchian)",
    description: "Long on break above N-day high, short on break below N-day low. Turtle-traders style.",
    params: [
      { key: "window", label: "Channel Window", min: 5, max: 100, step: 1, default: 20, unit: "days" },
      { key: "bars", label: "Bars", min: 100, max: 1500, step: 50, default: 750 },
      { key: "drift", label: "Drift", min: -0.2, max: 0.3, step: 0.01, default: 0.08 },
      { key: "volatility", label: "Volatility", min: 0.05, max: 0.6, step: 0.01, default: 0.2 },
      { key: "seed", label: "Random Seed", min: 1, max: 999, step: 1, default: 42 },
    ],
    run: (p) => backtestChannelBreakout({ ...p, startPrice: 100, initialCapital: 100000 }),
  },
  {
    id: "etf-mean-reversion",
    name: "Mean Reversion (Z-Score Fade)",
    description: "Buy when price is N std below its mean, sell when N std above. Range-bound markets only.",
    params: [
      { key: "window", label: "Lookback Window", min: 5, max: 100, step: 1, default: 20, unit: "days" },
      { key: "entryZ", label: "Entry Z-Score", min: 0.5, max: 3, step: 0.1, default: 2 },
      { key: "exitZ", label: "Exit Z-Score", min: 0, max: 1.5, step: 0.1, default: 0.5 },
      { key: "bars", label: "Bars", min: 100, max: 1500, step: 50, default: 750 },
      { key: "drift", label: "Drift", min: -0.2, max: 0.3, step: 0.01, default: 0.02 },
      { key: "volatility", label: "Volatility", min: 0.05, max: 0.6, step: 0.01, default: 0.15 },
      { key: "seed", label: "Random Seed", min: 1, max: 999, step: 1, default: 42 },
    ],
    run: (p) => backtestMeanReversion({ ...p, startPrice: 100, initialCapital: 100000 }),
  },
  {
    id: "price-momentum",
    name: "Price Momentum (Rate of Change)",
    description: "Go long when N-period rate of change is positive, short when negative. Trend-following.",
    params: [
      { key: "lookback", label: "Momentum Lookback", min: 5, max: 120, step: 1, default: 60, unit: "days" },
      { key: "holdPeriod", label: "Hold Period", min: 1, max: 30, step: 1, default: 5, unit: "days" },
      { key: "bars", label: "Bars", min: 100, max: 1500, step: 50, default: 750 },
      { key: "drift", label: "Drift", min: -0.2, max: 0.3, step: 0.01, default: 0.10 },
      { key: "volatility", label: "Volatility", min: 0.05, max: 0.6, step: 0.01, default: 0.18 },
      { key: "seed", label: "Random Seed", min: 1, max: 999, step: 1, default: 42 },
    ],
    run: (p) => backtestMomentum({ ...p, startPrice: 100, initialCapital: 100000 }),
  },
  {
    id: "pairs-trading",
    name: "Pairs Trading (Cointegration Spread)",
    description: "Trade the spread between two cointegrated stocks. Long when spread is below mean, short when above.",
    params: [
      { key: "window", label: "Lookback Window", min: 10, max: 120, step: 1, default: 60, unit: "days" },
      { key: "entryZ", label: "Entry Z-Score", min: 0.5, max: 3, step: 0.1, default: 2 },
      { key: "exitZ", label: "Exit Z-Score", min: 0, max: 1.5, step: 0.1, default: 0.3 },
      { key: "beta", label: "Cointegration β", min: 0.3, max: 2.0, step: 0.05, default: 1.0 },
      { key: "volatility", label: "Volatility", min: 0.05, max: 0.6, step: 0.01, default: 0.18 },
      { key: "bars", label: "Bars", min: 100, max: 1500, step: 50, default: 750 },
      { key: "seed", label: "Random Seed", min: 1, max: 999, step: 1, default: 42 },
    ],
    run: (p) => backtestPairsTrading({ ...p, startA: 100, startB: 100, initialCapital: 100000 }),
  },
  {
    id: "bollinger-bands",
    name: "Bollinger Bands Mean-Reversion",
    description: "Buy at lower band, sell at upper band, exit at middle. Classic volatility-envelope reversion.",
    params: [
      { key: "window", label: "BB Window", min: 5, max: 100, step: 1, default: 20, unit: "days" },
      { key: "k", label: "Std-Dev Multiplier", min: 1, max: 3, step: 0.1, default: 2 },
      { key: "entryZ", label: "Entry Z (unused)", min: 0, max: 3, step: 0.1, default: 0 },
      { key: "exitZ", label: "Exit Z (unused)", min: 0, max: 3, step: 0.1, default: 0 },
      { key: "bars", label: "Bars", min: 100, max: 1500, step: 50, default: 750 },
      { key: "drift", label: "Drift", min: -0.2, max: 0.3, step: 0.01, default: 0.02 },
      { key: "volatility", label: "Volatility", min: 0.05, max: 0.6, step: 0.01, default: 0.18 },
      { key: "seed", label: "Random Seed", min: 1, max: 999, step: 1, default: 42 },
    ],
    run: (p) => backtestBollingerBands({ ...p, startPrice: 100, initialCapital: 100000 }),
  },
  {
    id: "rsi-mean-reversion",
    name: "RSI Mean-Reversion",
    description: "Buy when RSI is oversold, sell when overbought, exit at mid-line. Wilder's RSI.",
    params: [
      { key: "window", label: "RSI Window", min: 5, max: 50, step: 1, default: 14, unit: "days" },
      { key: "oversold", label: "Oversold Level", min: 10, max: 40, step: 1, default: 30 },
      { key: "overbought", label: "Overbought Level", min: 60, max: 90, step: 1, default: 70 },
      { key: "exitMid", label: "Exit Mid Level", min: 30, max: 70, step: 1, default: 50 },
      { key: "bars", label: "Bars", min: 100, max: 1500, step: 50, default: 750 },
      { key: "drift", label: "Drift", min: -0.2, max: 0.3, step: 0.01, default: 0.02 },
      { key: "volatility", label: "Volatility", min: 0.05, max: 0.6, step: 0.01, default: 0.16 },
      { key: "seed", label: "Random Seed", min: 1, max: 999, step: 1, default: 42 },
    ],
    run: (p) => backtestRSI({ ...p, startPrice: 100, initialCapital: 100000 }),
  },
  {
    id: "macd-crossover",
    name: "MACD Crossover",
    description: "Long when MACD line is above signal line, short when below. Classic EMA crossover momentum.",
    params: [
      { key: "fast", label: "Fast EMA", min: 5, max: 30, step: 1, default: 12, unit: "days" },
      { key: "slow", label: "Slow EMA", min: 20, max: 60, step: 1, default: 26, unit: "days" },
      { key: "signal", label: "Signal EMA", min: 3, max: 20, step: 1, default: 9, unit: "days" },
      { key: "bars", label: "Bars", min: 100, max: 1500, step: 50, default: 750 },
      { key: "drift", label: "Drift", min: -0.2, max: 0.3, step: 0.01, default: 0.08 },
      { key: "volatility", label: "Volatility", min: 0.05, max: 0.6, step: 0.01, default: 0.2 },
      { key: "seed", label: "Random Seed", min: 1, max: 999, step: 1, default: 42 },
    ],
    run: (p) => backtestMACD({ ...p, startPrice: 100, initialCapital: 100000 }),
  },
];

export function getBacktestDef(id: string): BacktestDef | undefined {
  return BACKTEST_STRATEGIES.find((b) => b.id === id);
}
