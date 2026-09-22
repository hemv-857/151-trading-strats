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

    const res = await fetch(
      `http://localhost:3001/api/history?symbol=${encodeURIComponent(symbol)}&period=${encodeURIComponent(period)}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`yfinance service returned ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch market data", prices: [] }, { status: 502 });
  }
}
