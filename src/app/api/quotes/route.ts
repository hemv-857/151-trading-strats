import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 30; // cache for 30 seconds

// GET /api/quotes — real market data via Yahoo Finance
const QUOTE_SYMBOLS = ["SPY", "QQQ", "IWM", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "GLD", "TLT"];

export async function GET() {
  try {
    const symbols = QUOTE_SYMBOLS.join(",");
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status}`);
    const raw = await res.json();
    const quotes = (raw?.quoteResponse?.result ?? []).map((q: any) => ({
      symbol: q.symbol,
      price: q.regularMarketPrice,
      change: q.regularMarketChange,
      changePercent: q.regularMarketChangePercent,
      name: q.shortName || q.symbol,
    }));
    return NextResponse.json({ quotes });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch quotes", quotes: [] }, { status: 502 });
  }
}
