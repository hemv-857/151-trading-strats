import { NextRequest, NextResponse } from "next/server";
import { getBacktestDef } from "@/lib/backtest-engine";

export const dynamic = "force-dynamic";

// POST /api/backtest
// Body: { strategyId: string, params: Record<string, number> }
// Returns: BacktestResult
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { strategyId, params } = body as { strategyId: string; params: Record<string, number> };
    if (!strategyId) {
      return NextResponse.json({ error: "strategyId is required" }, { status: 400 });
    }
    const def = getBacktestDef(strategyId);
    if (!def) {
      return NextResponse.json({ error: `Unknown strategy: ${strategyId}` }, { status: 404 });
    }
    // Merge defaults with provided params, clamping to defined bounds
    const merged: Record<string, number> = {};
    for (const p of def.params) {
      const val = params?.[p.key] ?? p.default;
      merged[p.key] = Math.min(Math.max(val, p.min ?? -1e6), p.max ?? 1e6);
    }
    const result = def.run(merged);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Backtest failed" }, { status: 500 });
  }
}

// GET /api/backtest — list available backtest strategies + their params
import { BACKTEST_STRATEGIES } from "@/lib/backtest-engine";
export async function GET() {
  return NextResponse.json({
    strategies: BACKTEST_STRATEGIES.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      params: s.params,
    })),
  });
}
