import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/market-data?symbol=SPY&period=1y
// Fetches real price history via yfinance service
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol") || "SPY";
    const period = searchParams.get("period") || "1y";
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
