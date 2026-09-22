import { NextRequest, NextResponse } from "next/server";
import { getBacktestDef, sma, ema, rsi, rollingStd } from "@/lib/backtest-engine";

export const dynamic = "force-dynamic";

const ALLOWED_SYMBOLS = new Set([
  "SPY", "QQQ", "IWM", "DIA", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA",
  "META", "JPM", "BAC", "XOM", "CVX", "GLD", "SLV", "TLT", "HYG", "XLE",
  "XLF", "XLK", "XLV", "XLY", "XLP", "XLB", "XLI", "XLU", "XLRE", "XLC",
]);

// POST /api/backtest-real
// Body: { strategyId, params, symbol }
// Fetches real price history via yfinance, then runs the strategy on it
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { strategyId, params, symbol = "SPY" } = body as {
      strategyId: string;
      params: Record<string, number>;
      symbol?: string;
    };

    if (!strategyId) {
      return NextResponse.json({ error: "strategyId is required" }, { status: 400 });
    }

    if (!ALLOWED_SYMBOLS.has(symbol)) {
      return NextResponse.json({ error: `Invalid symbol: ${symbol}` }, { status: 400 });
    }

    const def = getBacktestDef(strategyId);
    if (!def) {
      return NextResponse.json({ error: `Unknown strategy: ${strategyId}` }, { status: 404 });
    }

    // Fetch real price history from yfinance service
    const bars = Math.min(Math.max(Math.floor(params?.bars ?? 500), 50), 2000);
    const period = bars <= 100 ? "6mo" : bars <= 250 ? "1y" : bars <= 500 ? "2y" : "5y";
    const yfRes = await fetch(
      `http://localhost:3001/api/history?symbol=${encodeURIComponent(symbol)}&period=${period}`,
      { cache: "no-store" }
    );
    if (!yfRes.ok) throw new Error(`yfinance service returned ${yfRes.status}`);
    const yfData = await yfRes.json();

    if (!yfData.prices || yfData.prices.length === 0) {
      return NextResponse.json({ error: `No price data for ${symbol}` }, { status: 404 });
    }

    // Take the last `bars` data points
    const allPrices = yfData.prices;
    const startIdx = Math.max(0, allPrices.length - bars);
    const realPrices = allPrices.slice(startIdx).map((p: any) => p.price);

    // Build a synthetic PriceSeries from real data for the backtest engine
    const dates = allPrices.slice(startIdx).map((p: any) => p.date);

    // Run the strategy function with the real price data injected
    // We need to adapt: the backtest functions call generatePriceSeries internally.
    // Instead, we'll run the strategy's position logic directly on the real prices.
    const result = runStrategyOnRealPrices(def, realPrices, dates, params, symbol);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Backtest failed" }, { status: 500 });
  }
}

// Run a backtest strategy on real price data
function runStrategyOnRealPrices(
  def: any,
  prices: number[],
  dates: string[],
  params: Record<string, number>,
  symbol: string
) {
  const initialCapital = 100000;
  // Merge defaults
  const merged: Record<string, number> = {};
  for (const p of def.params) merged[p.key] = params?.[p.key] ?? p.default;

  // Import the indicator + strategy functions dynamically
  // We'll compute positions using the same logic as the engine
  // Since the engine generates its own prices, we need to replicate the position logic here.
  // For simplicity, we'll use the engine's indicator functions and apply the same signal logic.

  // This is a simplified adapter that runs the strategy on real prices
  // by calling the same internal logic. We replicate the key strategies:

  const positions = computePositions(def.id, prices, merged);
  const equity: number[] = new Array(prices.length).fill(initialCapital);
  for (let i = 1; i < prices.length; i++) {
    const assetRet = prices[i] / prices[i - 1] - 1;
    const pos = positions[i - 1];
    const stratRet = pos * assetRet;
    equity[i] = equity[i - 1] * (1 + stratRet);
  }

  // Extract trades
  const trades: any[] = [];
  let curSide: "long" | "short" | "flat" = "flat";
  let entryIdx = -1;
  for (let i = 0; i <= prices.length; i++) {
    const pos = i < prices.length ? positions[i] : 0;
    const side: "long" | "short" | "flat" = pos > 0.01 ? "long" : pos < -0.01 ? "short" : "flat";
    if (side !== curSide) {
      if (curSide !== "flat" && entryIdx >= 0) {
        const exitIdx = i - 1;
        const dir = curSide === "long" ? 1 : -1;
        const pnl = dir * (prices[exitIdx] - prices[entryIdx]) * (initialCapital / prices[entryIdx]);
        trades.push({
          entryIdx, exitIdx, side: curSide,
          entryPrice: prices[entryIdx], exitPrice: prices[exitIdx],
          pnl, returnPct: dir * (prices[exitIdx] / prices[entryIdx] - 1),
        });
      }
      if (side !== "flat") entryIdx = i;
      curSide = side;
    }
  }

  const benchmark = prices.map((p) => (p / prices[0]) * initialCapital);
  const metrics = computeMetrics(equity, benchmark, trades, prices.length);
  const signals = prices.map((p, i) => ({ t: i, date: dates[i] || "", price: p, signal: positions[i] }));

  return {
    equity: equity.map((e, i) => ({ t: i, date: dates[i] || "", equity: e, benchmark: benchmark[i], position: positions[i] })),
    trades,
    metrics,
    signals,
    params: { ...merged, symbol, bars: prices.length, source: "yfinance" },
    strategyId: def.id,
    strategyName: def.name + " (Real Data)",
  };
}

// Compute positions for a given strategy on real prices
function computePositions(strategyId: string, prices: number[], params: Record<string, number>): number[] {
  const n = prices.length;
  const positions = new Array(n).fill(0);

  switch (strategyId) {
    case "single-moving-average": {
      const ma = sma(prices, params.maWindow ?? 50);
      for (let i = 0; i < n; i++) positions[i] = ma[i] !== null ? (prices[i] > (ma[i] as number) ? 1 : 0) : 0;
      break;
    }
    case "two-moving-averages": {
      const fast = sma(prices, params.fastWindow ?? 50);
      const slow = sma(prices, params.slowWindow ?? 200);
      for (let i = 0; i < n; i++) positions[i] = fast[i] !== null && slow[i] !== null ? ((fast[i] as number) > (slow[i] as number) ? 1 : -1) : 0;
      break;
    }
    case "three-moving-averages": {
      const m1 = sma(prices, params.w1 ?? 10), m2 = sma(prices, params.w2 ?? 50), m3 = sma(prices, params.w3 ?? 200);
      for (let i = 0; i < n; i++) {
        if (m1[i] === null || m2[i] === null || m3[i] === null) continue;
        const bull = (m1[i] as number) > (m2[i] as number) && (m2[i] as number) > (m3[i] as number);
        const bear = (m1[i] as number) < (m2[i] as number) && (m2[i] as number) < (m3[i] as number);
        positions[i] = bull ? 1 : bear ? -1 : 0;
      }
      break;
    }
    case "channel": {
      const w = params.window ?? 20;
      for (let i = w; i < n; i++) {
        let hi = -Infinity, lo = Infinity;
        for (let j = i - w; j < i; j++) { if (prices[j] > hi) hi = prices[j]; if (prices[j] < lo) lo = prices[j]; }
        if (prices[i] > hi) positions[i] = 1;
        else if (prices[i] < lo) positions[i] = -1;
        else positions[i] = positions[i - 1];
      }
      break;
    }
    case "etf-mean-reversion": {
      const w = params.window ?? 20;
      const m = sma(prices, w), s = rollingStd(prices, w);
      const entryZ = params.entryZ ?? 2, exitZ = params.exitZ ?? 0.5;
      let pos = 0;
      for (let i = 0; i < n; i++) {
        if (m[i] === null || s[i] === null) continue;
        const z = (prices[i] - (m[i] as number)) / (s[i] as number);
        if (pos === 0) { if (z < -entryZ) pos = 1; else if (z > entryZ) pos = -1; }
        else { if (pos === 1 && z > -exitZ) pos = 0; else if (pos === -1 && z < exitZ) pos = 0; }
        positions[i] = pos;
      }
      break;
    }
    case "bollinger-bands": {
      const w = params.window ?? 20, k = params.k ?? 2;
      const m = sma(prices, w), s = rollingStd(prices, w);
      let pos = 0;
      for (let i = 0; i < n; i++) {
        if (m[i] === null || s[i] === null) continue;
        const u = (m[i] as number) + k * (s[i] as number), l = (m[i] as number) - k * (s[i] as number), mid = m[i] as number;
        if (pos === 0) { if (prices[i] <= l) pos = 1; else if (prices[i] >= u) pos = -1; }
        else { if (pos === 1 && prices[i] >= mid) pos = 0; else if (pos === -1 && prices[i] <= mid) pos = 0; }
        positions[i] = pos;
      }
      break;
    }
    case "rsi-mean-reversion": {
      const r = rsi(prices, params.window ?? 14);
      const oversold = params.oversold ?? 30, overbought = params.overbought ?? 70, exitMid = params.exitMid ?? 50;
      let pos = 0;
      for (let i = 0; i < n; i++) {
        if (r[i] === null) continue;
        const v = r[i] as number;
        if (pos === 0) { if (v <= oversold) pos = 1; else if (v >= overbought) pos = -1; }
        else { if (pos === 1 && v >= exitMid) pos = 0; else if (pos === -1 && v <= exitMid) pos = 0; }
        positions[i] = pos;
      }
      break;
    }
    case "macd-crossover": {
      const macdLine = new Array(n).fill(null);
      const signalLine = new Array(n).fill(null);
      const fast = ema(prices, params.fast ?? 12), slow = ema(prices, params.slow ?? 26);
      for (let i = 0; i < n; i++) { if (fast[i] !== null && slow[i] !== null) macdLine[i] = (fast[i] as number) - (slow[i] as number); }
      // Signal = EMA of macd
      const macdVals = macdLine.map(v => v ?? 0);
      const sig = ema(macdVals, params.signal ?? 9);
      let pos = 0;
      for (let i = 0; i < n; i++) {
        if (macdLine[i] !== null && sig[i] !== null) { pos = (macdLine[i] as number) > (sig[i] as number) ? 1 : -1; }
        positions[i] = pos;
      }
      break;
    }
    case "price-momentum": {
      const lookback = params.lookback ?? 60;
      for (let i = lookback; i < n; i++) {
        const roc = prices[i] / prices[i - lookback] - 1;
        positions[i] = roc > 0.02 ? 1 : roc < -0.02 ? -1 : 0;
      }
      break;
    }
    default:
      // For pairs-trading and unknown strategies, just go long (buy and hold)
      for (let i = 0; i < n; i++) positions[i] = 1;
      break;
  }

  return positions;
}

function computeMetrics(equity: number[], benchmark: number[], trades: any[], periods: number) {
  const n = equity.length;
  const totalReturn = equity[n - 1] / equity[0] - 1;
  const benchmarkReturn = benchmark[n - 1] / benchmark[0] - 1;
  const years = periods / 252;
  const cagr = Math.pow(equity[n - 1] / equity[0], 1 / Math.max(years, 0.01)) - 1;
  const dailyReturns: number[] = [];
  for (let i = 1; i < n; i++) dailyReturns.push(equity[i] / equity[i - 1] - 1);
  const meanRet = dailyReturns.reduce((a, b) => a + b, 0) / Math.max(dailyReturns.length, 1);
  const stdRet = Math.sqrt(dailyReturns.reduce((a, b) => a + (b - meanRet) ** 2, 0) / Math.max(dailyReturns.length, 1));
  const sharpe = stdRet > 0 ? (meanRet / stdRet) * Math.sqrt(252) : 0;
  const downside = dailyReturns.filter((r) => r < 0);
  const downsideStd = Math.sqrt(downside.reduce((a, b) => a + b * b, 0) / Math.max(downside.length, 1));
  const sortino = downsideStd > 0 ? (meanRet / downsideStd) * Math.sqrt(252) : 0;
  let peak = equity[0], maxDD = 0;
  for (const v of equity) { if (v > peak) peak = v; const dd = (peak - v) / peak; if (dd > maxDD) maxDD = dd; }
  const calmar = maxDD > 0 ? cagr / maxDD : 0;
  const winTrades = trades.filter((t) => t.pnl > 0).length;
  const winRate = trades.length > 0 ? winTrades / trades.length : 0;
  const alpha = totalReturn - benchmarkReturn;
  const avgTradeReturn = trades.length > 0 ? trades.reduce((a, b) => a + b.returnPct, 0) / trades.length : 0;
  return { totalReturn, cagr, sharpe, sortino, maxDrawdown: maxDD, volatility: stdRet * Math.sqrt(252), winRate, numTrades: trades.length, benchmarkReturn, alpha, avgTradeReturn, calmar };
}
