import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 30; // cache for 30 seconds

// GET /api/quotes — real market data via yfinance service
export async function GET() {
  try {
    const res = await fetch("http://localhost:3001/api/quotes", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`yfinance service returned ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch quotes", quotes: [] }, { status: 502 });
  }
}
