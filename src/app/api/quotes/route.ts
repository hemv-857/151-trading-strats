import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/quotes — real market data via Yahoo Finance chart endpoint
// (v7/quote requires an auth crumb and returns 401; v8/chart does not)
const QUOTE_SYMBOLS = ["SPY", "QQQ", "IWM", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "GLD", "TLT"];

interface ChartMeta {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  chartPreviousClose?: number;
  shortName?: string;
}

async function fetchQuote(symbol: string) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`,
    { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status} for ${symbol}`);
  const raw = await res.json();
  const meta: ChartMeta | undefined = raw?.chart?.result?.[0]?.meta;
  const price = meta?.regularMarketPrice ?? 0;
  const prev = meta?.chartPreviousClose ?? price;
  const changePct = meta?.regularMarketChangePercent ?? (price && prev ? ((price - prev) / prev) * 100 : 0);
  return {
    symbol,
    price,
    change: price - prev,
    changePct,
    name: meta?.shortName || symbol,
  };
}

export async function GET() {
  try {
    const settled = await Promise.allSettled(QUOTE_SYMBOLS.map(fetchQuote));
    const quotes = settled
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchQuote>>> => r.status === "fulfilled")
      .map((r) => r.value);
    if (quotes.length === 0) throw new Error("No quotes available");
    return NextResponse.json({ quotes });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch quotes", quotes: [] }, { status: 502 });
  }
}
