import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_SYMBOLS = new Set([
  "SPY", "QQQ", "IWM", "DIA", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA",
  "META", "JPM", "BAC", "XOM", "CVX", "GLD", "SLV", "TLT", "HYG", "XLE",
  "XLF", "XLK", "XLV", "XLY", "XLP", "XLB", "XLI", "XLU", "XLRE", "XLC",
]);

// GET /api/market-data?symbol=SPY&period=1y
// Fetches real price history via yfinance service
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol") || "SPY";
    const period = searchParams.get("period") || "1y";

    if (!ALLOWED_SYMBOLS.has(symbol)) {
      return NextResponse.json({ error: `Invalid symbol: ${symbol}`, prices: [] }, { status: 400 });
    }

    const yfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${encodeURIComponent(period)}&interval=1d`;
    const res = await fetch(yfUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status}`);
    const raw = await res.json();
    const timestamps: number[] = raw?.chart?.result?.[0]?.timestamp ?? [];
    const closes: number[] = raw?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
    const prices = timestamps
      .map((ts: number, i: number) => ({ date: new Date(ts * 1000).toISOString().slice(0, 10), price: closes[i] }))
      .filter((p: any) => p.price != null && isFinite(p.price));
    return NextResponse.json({ prices });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch market data", prices: [] }, { status: 502 });
  }
}
