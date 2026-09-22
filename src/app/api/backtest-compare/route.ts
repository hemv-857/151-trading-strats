import { NextRequest, NextResponse } from "next/server";
import { getBacktestDef } from "@/lib/backtest-engine";

export const dynamic = "force-dynamic";

// POST /api/backtest-compare
// Body: { strategies: [{ strategyId, params }] } (1-3 strategies)
// Returns: { results: [{ strategyId, strategyName, equity, metrics, params }] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { strategies } = body as { strategies: { strategyId: string; params: Record<string, number> }[] };
    if (!Array.isArray(strategies) || strategies.length === 0 || strategies.length > 3) {
      return NextResponse.json({ error: "Provide 1-3 strategies to compare" }, { status: 400 });
    }
    const results: { strategyId: string; strategyName?: string; error?: string; metrics?: any; equity?: any; params?: any }[] = [];
    for (const { strategyId, params } of strategies) {
      const def = getBacktestDef(strategyId);
      if (!def) {
        results.push({ strategyId, error: `Unknown strategy: ${strategyId}` });
        continue;
      }
      const merged: Record<string, number> = {};
      for (const p of def.params) merged[p.key] = params?.[p.key] ?? p.default;
      // Ensure common bars/seed for fair comparison
      const result = def.run(merged);
      results.push({
        strategyId: result.strategyId,
        strategyName: result.strategyName,
        metrics: result.metrics,
        equity: result.equity,
        params: result.params,
      });
    }
    return NextResponse.json({ results });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Compare backtest failed" }, { status: 500 });
  }
}
